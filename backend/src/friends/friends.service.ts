import { Prisma, PrismaClient, SettingFriendRequest } from "@blacket/core";
import {
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SocketService } from "src/socket/socket.service";
import { Forbidden, NotFound, PublicUser } from "@blacket/types";
import { DefaultArgs } from "@prisma/client/runtime/library";

@Injectable()
export class FriendsService {
    private readonly friendSelect = {
        id: true,
        username: true,
        avatar: { include: {} },
        banner: { include: {} },
        customAvatar: { include: {} },
        customBanner: { include: {} },
        color: true,
        fontId: true,
        titleId: true
    } satisfies Prisma.UserSelect;

    constructor(private prismaService: PrismaService,
        private socketService: SocketService,) { }

    _mappedFriends(friends: any[]): PublicUser[] {
        return friends.map((friend) => friend);
    }

    async isBlocked(userId: string,
        friendId: string,
        tx: Omit<
            PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
            | "$connect"
            | "$disconnect"
            | "$on"
            | "$transaction"
            | "$use"
            | "$extends"
        > = this.prismaService,): Promise<boolean> {
        return (
            (await tx.user.count({
                where: {
                    id: friendId,
                    blocked: { some: { id: userId } }
                }
            })) > 0
        );
    }
    async blockUser(userId: string, friendId: string): Promise<void> {
        if (userId === friendId) throw new ForbiddenException(Forbidden.FRIENDS_CANNOT_BLOCK_SELF);

        return this.prismaService.$transaction(async (tx) => {
            if (
                (await tx.user.count({
                    where: { id: userId, blocked: { some: { id: friendId } } }
                })) > 0
            ) throw new ForbiddenException(Forbidden.FRIENDS_BLOCK_EXISTS);

            await tx.user.update({
                where: { id: userId },
                data: {
                    blocked: {
                        connect: {
                            id: friendId
                        }
                    },

                    friends: {
                        disconnect: {
                            id: friendId
                        }
                    },
                    friendedBy: {
                        disconnect: {
                            id: friendId
                        }
                    }
                }
            });

            const me = await this.getFriend(userId, tx);
            if (!me) return;

            this.socketService.emitFriendsRemovedEvent(friendId, new PublicUser(me),);
        });
    }

    async unblockUser(userId: string, friendId: string): Promise<void> {
        return this.prismaService.$transaction(async (tx) => {
            if (
                (await tx.user.count({
                    where: { id: userId, blocked: { some: { id: friendId } } }
                })) === 0
            ) throw new ForbiddenException(Forbidden.FRIENDS_NOT_BLOCKED);

            await tx.user.update({
                where: { id: userId },
                data: {
                    blocked: {
                        disconnect: {
                            id: friendId
                        }
                    }
                }
            });
        });
    }

    async removeFriend(userId: string, friendId: string): Promise<void> {
        return this.prismaService.$transaction(async (tx) => {
            if (
                !(
                    (await tx.user.count({
                        where: {
                            id: userId,
                            AND: {
                                friends: { some: { id: friendId } },
                                friendedBy: { some: { id: friendId } }
                            }
                        }
                    })) > 0
                )
            ) throw new ForbiddenException(Forbidden.FRIENDS_NOT_FRIENDS);

            await tx.user.update({
                where: { id: userId },
                data: {
                    friends: { disconnect: { id: friendId } },
                    friendedBy: { disconnect: { id: friendId } }
                }
            });

            const me = await this.getFriend(userId, tx);
            if (!me) return;

            this.socketService.emitFriendsRemovedEvent(friendId, new PublicUser(me),);
        });
    }

    async revokeRequest(userId: string, friendId: string): Promise<void> {
        return this.prismaService.$transaction(async (tx) => {
            if (
                !(
                    (await tx.user.count({
                        where: {
                            id: userId,
                            AND: {
                                friends: { some: { id: friendId } },
                                friendedBy: { none: { id: friendId } }
                            }
                        }
                    })) > 0
                )
            ) throw new ForbiddenException(Forbidden.FRIENDS_REQUEST_NOT_EXISTS,);

            await tx.user.update({
                where: { id: userId },
                data: {
                    friends: { disconnect: { id: friendId } }
                }
            });

            const me = await this.getFriend(userId, tx);
            if (!me) return;

            this.socketService.emitFriendsRequestRemovedEvent(friendId, new PublicUser(me),);
        });
    }

    async declineRequest(userId: string, friendId: string): Promise<void> {
        return this.prismaService.$transaction(async (tx) => {
            if (
                !(
                    (await tx.user.count({
                        where: {
                            id: userId,
                            AND: {
                                friendedBy: { some: { id: friendId } },
                                friends: { none: { id: friendId } }
                            }
                        }
                    })) > 0
                )
            ) throw new ForbiddenException(Forbidden.FRIENDS_REQUEST_NOT_EXISTS,);

            await tx.user.update({
                where: { id: userId },
                data: {
                    friendedBy: { disconnect: { id: friendId } }
                }
            });

            const me = await this.getFriend(userId, tx);
            if (!me) return;

            this.socketService.emitFriendsRequestDeclinedEvent(friendId, new PublicUser(me),);
        });
    }

    async addFriend(userId: string, friendId: string): Promise<void> {
        if (userId === friendId) throw new ForbiddenException(Forbidden.FRIENDS_CANNOT_FRIEND_SELF);

        return this.prismaService.$transaction(async (tx) => {
            if (await this.isBlocked(userId, friendId, tx)) throw new ForbiddenException(Forbidden.FRIENDS_FRIEND_REQUESTS_OFF,);

            if (
                (await tx.user.count({
                    where: {
                        id: userId,
                        AND: {
                            friends: { some: { id: friendId } }
                        }
                    }
                })) > 0
            ) throw new ForbiddenException(Forbidden.FRIENDS_FRIEND_EXISTS);

            const friend = await tx.user.findUnique({
                where: { id: friendId },
                select: {
                    id: true,
                    settings: true,
                    friends: {
                        select: { id: true }
                    }
                }
            });
            if (!friend) throw new NotFoundException(NotFound.UNKNOWN_USER);

            if (!friend.friends.some((f) => f.id === userId)) {
                switch (friend.settings?.friendRequests) {
                    case SettingFriendRequest.OFF:
                        throw new ForbiddenException(Forbidden.FRIENDS_FRIEND_REQUESTS_OFF,);
                    case SettingFriendRequest.MUTUAL: {
                        const myFriends = await tx.user.findUnique({
                            where: { id: userId },
                            select: {
                                friends: {
                                    select: { id: true }
                                }
                            }
                        });
                        if (!myFriends) throw new NotFoundException(NotFound.UNKNOWN_USER);

                        const isMutual = friend.friends.some((f) =>
                            myFriends.friends.map((mf) => mf.id).includes(f.id),);
                        if (!isMutual) throw new ForbiddenException(Forbidden.FRIENDS_FRIEND_REQUESTS_OFF,);
                    }
                }
            }

            await tx.user.update({
                where: { id: userId },
                data: {
                    friends: {
                        connect: {
                            id: friendId
                        }
                    }
                }
            });

            const me = await this.getFriend(userId, tx);
            if (!me) return;

            this.socketService.emitFriendsRequestReceivedEvent(friend.id, new PublicUser(me),);
        });
    }

    async getFriends(userId: string) {
        const friends = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            select: {
                friends: {
                    select: this.friendSelect
                },
                friendedBy: {
                    select: this.friendSelect
                },
                blocked: {
                    select: this.friendSelect
                }
            }
        });
        if (!friends) throw new NotFoundException(NotFound.UNKNOWN_USER);

        return {
            friends: this._mappedFriends(friends.friends),
            friendedBy: this._mappedFriends(friends.friendedBy),
            blocked: this._mappedFriends(friends.blocked)
        };
    }

    async getFriend(userId: string,
        tx: Omit<
            PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
            | "$connect"
            | "$disconnect"
            | "$on"
            | "$transaction"
            | "$use"
            | "$extends"
        > = this.prismaService,) {
        const friend = await tx.user.findUnique({
            where: {
                id: userId
            },
            select: this.friendSelect
        });
        if (!friend) return null;

        return friend;
    }
}

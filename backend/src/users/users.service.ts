import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";
import { hash } from "bcrypt";
import { DiscordAccessToken, DiscordDiscordUser, User } from "@blacket/types";
import {
    Font,
    PermissionType,
    Prisma,
    Title,
    OAuthType,
    UserDiscord,
    Transaction,
    UserSubscriptionStatus
} from "@blacket/core";

export interface GetUserSettings {
    cacheUser?: boolean;
    includeBanners?: boolean;
    includeBlooksCurrent?: boolean;
    includeBlooksAll?: boolean;
    includeDiscord?: boolean;
    includeItemsCurrent?: boolean;
    includeItemsAll?: boolean;
    includeAuthMethods?: boolean;
    includePaymentMethods?: boolean;
    includeSubscription?: boolean;
    includeStatistics?: boolean;
    includeSettings?: boolean;
    includeTitles?: boolean;
    includeFonts?: boolean;
    includeRooms?: boolean;
    includeDeleted?: boolean;
}

@Injectable()
export class UsersService implements OnApplicationBootstrap {
    private defaultPermissions: PermissionType[];
    private defaultTitle: Title;
    private defaultFont: Font;

    constructor(private prismaService: PrismaService,
        private redisService: RedisService,) {}

    async onApplicationBootstrap() {
        this.defaultPermissions = [
            PermissionType.CREATE_REPORTS,
            PermissionType.CHANGE_USERNAME
        ];

        this.defaultTitle = await this.prismaService.title.findFirst({
            where: {
                default: true,
                priority: 0
            }
        });
        if (!this.defaultTitle) throw new Error("Default title not found");

        this.defaultFont = await this.prismaService.font.findFirst({
            where: {
                default: true,
                priority: 0
            }
        });
        if (!this.defaultFont) throw new Error("Default font not found");
    }

    async readRules(userId: string): Promise<void> {
        await this.prismaService.user.update({
            where: { id: userId },
            data: { readRulesAt: new Date() }
        });
    }

    async getUser(user: string,
        settings: GetUserSettings = {
            cacheUser: true
        },): Promise<User | null> {
        if (settings.cacheUser) {
            const cachedUser = await this.redisService.getKey("cachedUser", user.toLowerCase(),);

            if (cachedUser) return cachedUser;
        }

        const include: Prisma.UserInclude = {};

        if (settings.includeBanners) include.banners = true;
        if (settings.includeBlooksCurrent) include.blooks = {
                select: {
                    id: true,
                    blookId: true,
                    shiny: true,
                    serial: true
                },
                where: {
                    sold: false,
                    auctions: {
                        none: {
                            AND: [{ buyerId: null }, { delistedAt: null }]
                        }
                    }
                }
            };
        if (settings.includeBlooksAll) include.blooks = true;
        if (settings.includeItemsCurrent) include.items = {
                select: {
                    id: true,
                    itemId: true,
                    usesLeft: true,
                    createdAt: true,
                    updatedAt: true
                },
                where: {
                    usesLeft: { gt: 0 },
                    auctions: {
                        none: {
                            AND: [{ buyerId: null }, { delistedAt: null }]
                        }
                    }
                }
            };
        if (settings.includeItemsAll) include.items = {
                select: { id: true, itemId: true, usesLeft: true }
            };
        if (settings.includeStatistics) include.statistics = {
                omit: {
                    id: true
                }
            };
        if (settings.includeDiscord) include.discord = true;
        if (settings.includeTitles) include.titles = true;
        if (settings.includeFonts) include.fonts = true;
        if (settings.includeSettings) include.settings = {
                omit: {
                    id: true
                }
            };
        if (settings.includeAuthMethods) include.authMethods = {
                omit: { publicKey: true, counter: true }
            };
        if (settings.includePaymentMethods) include.paymentMethods = {
                where: { deletedAt: null }
            };
        if (settings.includeSubscription) include.subscriptions = {
                where: {
                    status: {
                        in: [
                            UserSubscriptionStatus.ACTIVE,
                            UserSubscriptionStatus.PENDING_CANCELLATION
                        ]
                    },
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                },
                orderBy: { expiresAt: "desc" },
                take: 1
            };
        if (settings.includeRooms) include.rooms = { omit: { public: true } };

        const userData = await this.prismaService.user.findFirst({
            where: {
                ...(!settings.includeDeleted ? { deletedAt: null } : {}),
                OR: [
                    { id: user },
                    { username: { equals: user, mode: "insensitive" } }
                ]
            },
            include: {
                avatar: {
                    select: {
                        blookId: true,
                        shiny: true
                    }
                },
                customAvatar: true,
                customBanner: true,
                groups: true,
                ...include
            }
        });
        if (!userData) return null;

        if (settings.cacheUser) {
            await this.redisService.setKey("cachedUser", userData.id, userData, 600,);
            await this.redisService.setKey("cachedUser", userData.username.toLowerCase(), userData, 600,);
        }

        return userData;
    }

    async userExists(user: string): Promise<boolean> {
        const count = await this.prismaService.user.count({
            where: {
                OR: [
                    { id: user },
                    {
                        username: {
                            equals: user,
                            mode: "insensitive"
                        }
                    }
                ]
            }
        });

        return count > 0;
    }

    async createUser(username: string,
        password: string,
        ip: string,): Promise<User> {
        return await this.prismaService.$transaction(async (tx) => {
            const ipAddress = await tx.ipAddress.upsert({
                where: { ipAddress: ip },
                update: {},
                create: { ipAddress: ip }
            });

            const user = await tx.user.create({
                data: {
                    id:
                        Math.floor(Date.now() / 1000).toString() +
                        Math.floor(1000000 + Math.random() * 9000000,).toString(),
                    username,
                    password: await hash(password, 10),
                    titleId: this.defaultTitle.id,
                    fontId: this.defaultFont.id,
                    permissions: this.defaultPermissions,
                    tokens: 1500,
                    crystals: 1000,
                    diamonds: 100,

                    ipAddressId: ipAddress.id
                }
            });

            await tx.userStatistic.create({ data: { id: user.id } });
            await tx.userSetting.create({ data: { id: user.id } });

            return user;
        });
    }

    async updateUserIp(user: User, ip: string): Promise<void> {
        return await this.prismaService.$transaction(async (tx) => {
            const ipAddress = await tx.ipAddress.upsert({
                where: { ipAddress: ip },
                update: {},
                create: { ipAddress: ip }
            });

            const userIpAddress =
                (await tx.userIpAddress.findFirst({
                    where: { userId: user.id, ipAddressId: ipAddress.id }
                })) ??
                (await tx.userIpAddress.create({
                    data: { userId: user.id, ipAddressId: ipAddress.id }
                }));

            await tx.userIpAddress.update({
                data: { uses: { increment: 1 } },
                where: { id: userIpAddress.id }
            });
            await tx.user.update({
                where: { id: user.id },
                data: { ipAddress: { connect: { id: ipAddress.id } } }
            });
        });
    }

    async linkDiscordOAuth(userId: string,
        accessTokenResponse: DiscordAccessToken,
        discordUser: DiscordDiscordUser,): Promise<UserDiscord> {
        return await this.prismaService.$transaction(async (prisma) => {
            await prisma.userOAuth.create({
                data: {
                    user: { connect: { id: userId } },
                    accessToken: accessTokenResponse.access_token,
                    refreshToken: accessTokenResponse.refresh_token,
                    tokenType: accessTokenResponse.token_type,
                    scope: accessTokenResponse.scope,
                    expiresAt: new Date(Date.now() + accessTokenResponse.expires_in * 1000,),
                    type: OAuthType.DISCORD
                }
            });

            const userDiscord = await prisma.userDiscord.create({
                data: {
                    user: { connect: { id: userId } },
                    discordId: discordUser.id,
                    username: discordUser.username,
                    avatar: discordUser.avatar
                }
            });

            return userDiscord;
        });
    }

    async getTransactions(userId: string,): Promise<
        Omit<Transaction, "ipAddressId" | "userId" | "stripePaymentId">[]
    > {
        return await this.prismaService.transaction.findMany({
            where: { userId },
            omit: {
                ipAddressId: true,
                stripePaymentId: true,
                userId: true
            },
            orderBy: { createdAt: "desc" }
        });
    }
}

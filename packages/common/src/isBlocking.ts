import { FriendsFriendsEntity } from "@blacket/types";

export function isBlocking(userId: string, entity: FriendsFriendsEntity): boolean {
    return entity.blocked.some((b) => b.id === userId);
}

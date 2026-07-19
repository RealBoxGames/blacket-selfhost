import { FriendsFriendsEntity } from "@blacket/types";

export function isFriendsWith(userId: string, entity: FriendsFriendsEntity): boolean {
    return entity.friends.some((f) => f.id === userId) && entity.friendedBy.some((f) => f.id === userId);
}

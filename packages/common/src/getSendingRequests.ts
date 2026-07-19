import { FriendsFriendsEntity } from "@blacket/types";

export function getSendingRequests(entity: FriendsFriendsEntity): FriendsFriendsEntity["friends"] {
    return entity.friends.filter((f) => !entity.friendedBy.some((fr) => fr.id === f.id));
}

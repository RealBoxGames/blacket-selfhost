import { FriendsFriendsEntity } from "@blacket/types";

export function getFriendRequests(entity: FriendsFriendsEntity): FriendsFriendsEntity["friendedBy"] {
    return entity.friendedBy.filter((f) => !entity.friends.some((fr) => fr.id === f.id));
}

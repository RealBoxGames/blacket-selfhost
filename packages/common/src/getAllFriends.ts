import { FriendsFriendsEntity } from "@blacket/types";

export function getAllFriends(entity: FriendsFriendsEntity): FriendsFriendsEntity["friends"] {
    return entity.friends.filter((f) => entity.friendedBy.some((fr) => fr.id === f.id));
}

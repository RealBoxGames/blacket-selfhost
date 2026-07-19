import { FriendsFriendsEntity, PublicUser } from "@blacket/types";

export interface FriendStore extends FriendsFriendsEntity {
    setFriends: (friends: PublicUser[]) => void;
    setFriendedBy: (friendedBy: PublicUser[]) => void;
    setBlocked: (blocked: PublicUser[]) => void;

    isFriendsWith: (userId: string) => boolean;
    isBlocking: (userId: string) => boolean;

    getFriendRequests: () => PublicUser[];
    getSendingRequests: () => PublicUser[];

    isRequesting: (userId: string) => boolean;
    isRequestedBy: (userId: string) => boolean;

    addFriend: (user: PublicUser) => void;
    addRequest: (user: PublicUser) => void;
    removeFriend: (userId: string) => void;
    removeRequest: (userId: string) => void;
    blockUser: (user: PublicUser) => void;
    unblockUser: (userId: string) => void;

    getAllFriends: () => PublicUser[];
}

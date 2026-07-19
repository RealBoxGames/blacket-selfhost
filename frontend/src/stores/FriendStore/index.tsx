import { create } from "zustand";

import {
    isFriendsWith as isFriendsWithCommon,
    isBlocking as isBlockingCommon,
    getFriendRequests as getFriendRequestsCommon,
    getSendingRequests as getSendingRequestsCommon,
    getAllFriends as getAllFriendsCommon
} from "@blacket/common";
import { FriendStore } from "./friendStore.d";

export const useFriend = create<FriendStore>((set, get) => ({
    friends: [],
    friendedBy: [],
    blocked: [],

    setFriends: (friends) => set({ friends }),
    setFriendedBy: (friendedBy) => set({ friendedBy }),
    setBlocked: (blocked) => set({ blocked }),

    isFriendsWith: (userId) => {
        const { friends, friendedBy } = get();

        return isFriendsWithCommon(userId, { friends, friendedBy, blocked: [] });
    },
    isBlocking: (userId) => {
        const { blocked } = get();

        return isBlockingCommon(userId, { friends: [], friendedBy: [], blocked });
    },

    getFriendRequests: () => {
        const { friends, friendedBy } = get();

        return getFriendRequestsCommon({ friends, friendedBy, blocked: [] });
    },
    getSendingRequests: () => {
        const { friends, friendedBy } = get();

        return getSendingRequestsCommon({ friends, friendedBy, blocked: [] });
    },

    isRequesting: (userId) => {
        const { friends, friendedBy } = get();

        return getSendingRequestsCommon({ friends, friendedBy, blocked: [] }).some((u) => u.id === userId);
    },

    isRequestedBy: (userId) => {
        const { friends, friendedBy } = get();

        return getFriendRequestsCommon({ friends, friendedBy, blocked: [] }).some((u) => u.id === userId);
    },

    addFriend: (user) => {
        const { friends } = get();

        set({ friends: [...friends, user] });
    },

    addRequest: (user) => {
        const { friendedBy } = get();

        set({ friendedBy: [...friendedBy, user] });
    },

    removeFriend: (userId) => {
        const { friends } = get();

        set({ friends: friends.filter((u) => u.id !== userId) });
    },

    removeRequest: (userId) => {
        const { friendedBy } = get();

        set({ friendedBy: friendedBy.filter((u) => u.id !== userId) });
    },

    blockUser: (user) => {
        const { blocked, friends, friendedBy } = get();

        set({
            blocked: [...blocked, user],
            friends: friends.filter((u) => u.id !== user.id),
            friendedBy: friendedBy.filter((u) => u.id !== user.id)
        });
    },

    unblockUser: (userId) => {
        const { blocked } = get();

        set({ blocked: blocked.filter((u) => u.id !== userId) });
    },

    getAllFriends: () => {
        const { friends, friendedBy } = get();

        return getAllFriendsCommon({ friends, friendedBy, blocked: [] });
    }
}));

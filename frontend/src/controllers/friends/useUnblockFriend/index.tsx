import { useFriend } from "@stores/FriendStore/index";

export function useUnblockFriend() {
    const { unblockUser } = useFriend();

    const unblockFriend = (userId: string) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.post(`/api/friends/${userId}/unblock`, {})
        .then((res: Fetch2Response) => {
            unblockUser(userId);

            resolve(res);
        })
        .catch(reject));

    return { unblockFriend };
}

import { useFriend } from "@stores/FriendStore/index";

export function useRevokeRequest() {
    const { friends, setFriends } = useFriend();

    const revokeRequest = (userId: string) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.post(`/api/friends/${userId}/revoke`, {})
        .then((res: Fetch2Response) => {
            setFriends(friends.filter((f) => f.id !== userId));

            resolve(res);
        })
        .catch(reject));

    return { revokeRequest };
}

import { useFriend } from "@stores/FriendStore/index";

export function useDeclineRequest() {
    const { friendedBy, setFriendedBy } = useFriend();

    const declineRequest = (userId: string) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.post(`/api/friends/${userId}/decline`, {})
        .then((res: Fetch2Response) => {
            setFriendedBy(friendedBy.filter((f) => f.id !== userId));

            resolve(res);
        })
        .catch(reject));

    return { declineRequest };
}

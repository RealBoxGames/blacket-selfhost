import { useFriend } from "@stores/FriendStore/index";

export function useRemoveFriend() {
    const { friends, friendedBy, setFriends, setFriendedBy } = useFriend();

    const removeFriend = (userId: string) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.delete(`/api/friends/${userId}`, {})
        .then((res: Fetch2Response) => {
            setFriends(friends.filter((f) => f.id !== userId));
            setFriendedBy(friendedBy.filter((f) => f.id !== userId));

            resolve(res);
        })
        .catch(reject));

    return { removeFriend };
}

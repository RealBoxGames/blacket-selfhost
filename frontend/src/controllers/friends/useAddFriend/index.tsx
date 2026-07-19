import { useFriend } from "@stores/FriendStore/index";
import { useCachedUser } from "@stores/CachedUserStore/index";

export function useAddFriend() {
    const { friends, setFriends } = useFriend();
    const { addCachedUser } = useCachedUser();

    const addFriend = (userId: string) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.post(`/api/friends/${userId}`, {})
        .then((res: Fetch2Response) => {
            // WARNING: addCachedUser creates a dummy user first, then fetches the real user data
            // if the user requested a user and immediately friended them after, this will respond with the dummy user
            // this is rare but can happen, so be aware of it
            addCachedUser(userId)
                .then((r) => {
                    setFriends([...friends, r]);
                    resolve(res);
                })
                .catch(reject);
        })
        .catch(reject));

    return { addFriend };
}

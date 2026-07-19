import { useFriend } from "@stores/FriendStore/index";
import { useCachedUser } from "@stores/CachedUserStore/index";

export function useBlockFriend() {
    const { blockUser } = useFriend();
    const { addCachedUser } = useCachedUser();

    const blockFriend = (userId: string) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.post(`/api/friends/${userId}/block`, {})
        .then((res: Fetch2Response) => {
            // WARNING: same warning from useAddFriend
            addCachedUser(userId)
                .then((r) => {
                    blockUser(r);

                    resolve(res);
                })
                .catch(reject);
        })
        .catch(reject));

    return { blockFriend };
}

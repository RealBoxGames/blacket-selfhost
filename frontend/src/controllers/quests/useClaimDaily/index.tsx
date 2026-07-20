import { useUser } from "@stores/UserStore/index";

type Response = Fetch2Response & { data: { tokens: number } };

export function useClaimDaily() {
    const { user, setUser } = useUser();

    if (!user) throw new Error();

    const claimDaily = () => new Promise<Response>((resolve, reject) => window.fetch2.post("/api/quests/daily", {})
        .then((res: Response) => {
            setUser({ ...user, tokens: user.tokens + res.data.tokens, lastClaimed: new Date() });

            resolve(res);
        })
        .catch(reject));

    return { claimDaily };
}

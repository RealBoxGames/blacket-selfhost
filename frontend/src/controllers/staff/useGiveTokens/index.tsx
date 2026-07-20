type Response = Fetch2Response & { data: { username: string; tokens: number } };

export function useGiveTokens() {
    const giveTokens = (username: string, tokens: number) => new Promise<Response>((resolve, reject) => window.fetch2.post("/api/staff/give", { username, tokens })
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { giveTokens };
}

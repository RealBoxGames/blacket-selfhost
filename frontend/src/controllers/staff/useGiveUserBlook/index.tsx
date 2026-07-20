type Response = Fetch2Response & { data: any };

export function useGiveUserBlook() {
    const giveUserBlook = (userId: string, blookId: number, shiny: boolean) => new Promise<Response>((resolve, reject) => window.fetch2.post(`/api/staff/users/${userId}/blooks`, { blookId, shiny })
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { giveUserBlook };
}

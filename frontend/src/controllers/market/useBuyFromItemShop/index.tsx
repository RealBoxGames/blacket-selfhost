export function useBuyFromItemShop() {
    const buyFromItemShop = (id: number) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.post(`/api/market/item-shop/${id}`, {})
        .then((res: Fetch2Response) => resolve(res))
        .catch(reject));

    return { buyFromItemShop };
}

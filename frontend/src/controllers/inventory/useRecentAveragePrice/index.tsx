import { InventoryRecentAveragePriceEntity, InventoryRecentAveragePriceDto } from "@blacket/types";

type Response = Fetch2Response & {
    data: InventoryRecentAveragePriceEntity;
};

export function useRecentAveragePrice() {
    const getRecentAveragePrice = (dto?: InventoryRecentAveragePriceDto) => new Promise<Response>((resolve, reject) => {
        window.fetch2.get(`/api/inventory/recent-average-price/${JSON.stringify(dto)}`)
            .then((res: Response) => resolve(res))
            .catch(reject);
    });

    return { getRecentAveragePrice };
}

export class InventoryRecentAveragePriceEntity {
    averagePrice: number | null;
    lowestPrice: number | null;
    highestPrice: number | null;
    suspicious: boolean;

    constructor(partial: Partial<InventoryRecentAveragePriceEntity>) {
        Object.assign(this, partial);
    }
}

export class InventoryExistCountEntity {
    count: number;

    constructor(partial: Partial<InventoryExistCountEntity>) {
        Object.assign(this, partial);
    }
}
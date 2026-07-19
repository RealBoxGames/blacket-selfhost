export class StripeProductEntity {
    id: number;

    name: string;
    subname?: string;
    tag?: string;
    subtag?: string;
    description: string;

    price: number;
    discount?: number;

    imageId: number;
    fontId?: number;

    color1: string;
    color2: string;

    priority: number;

    isQuantityCapped: boolean;
    isPriceUsingCrystals: boolean;

    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<StripeProductEntity>) {
        Object.assign(this, partial);
    }
}

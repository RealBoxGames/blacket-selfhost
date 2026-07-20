export class StripeSubscriptionEntity {
    id: number;

    name: string;
    description: string;
    shortDescription: string;

    monthlyPrice?: number;
    yearlyPrice?: number
    lifetimePrice?: number;

    tokenPrice?: number;
    diamondPrice?: number;
    crystalPrice?: number;

    imageId: number;

    color1: string;
    color2: string;

    priority: number;

    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<StripeSubscriptionEntity>) {
        Object.assign(this, partial);
    }
}

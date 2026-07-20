import { ItemType, PermissionType, RewardType } from "@blacket/core";

export interface GroupSeed {
    name: string;
    permissions: PermissionType[];
    image: string;
    priority: number;
}

export interface ItemSeed {
    name: string;
    description: string;
    rarity: string;
    image: string;
    canUse: boolean;
    canTrade: boolean;
    canAuction: boolean;
    type: ItemType;
    boosterDuration?: number;
    boosterMultiplier?: number;
}

export interface StoreSeed {
    name: string;
    description: string;
    priority: number;
}

export interface PackBlookSeed {
    name: string;
    rarity: string;
    price: number;
    chance: number;
    isBig?: boolean;
    video?: {
        reference: string;
        path: string;
        length: number;
    };
}

export interface PackSeed {
    name: string;
    price: number;
    imageReference: string;
    imagePath: string;
    iconReference: string;
    iconPath: string;
    backgroundReference: string;
    backgroundPath: string;
    blooks: PackBlookSeed[];
}

export interface ProductSeed {
    name: string;
    price: number;
    image: string;
    color1: string;
    color2: string;
    isQuantityCapped: boolean;
    isPriceUsingCrystals?: boolean;
    subname?: string;
    tag?: string;
    subtag?: string;
    store: string;
    rewards: {
        type: RewardType;
        quantity: number;
        blook?: string;
    };
}

export interface SubscriptionSeed {
    stripeProductId: string;
    name: string;
    priority: number;
    description: string;
    shortDescription: string;
    image: string;
    monthlyPriceId: string;
    yearlyPriceId: string;
    lifetimePrice: number;
    tokenPrice?: number;
    diamondPrice?: number;
    crystalPrice?: number;
    color1: string;
    color2: string;
    group: string;
}

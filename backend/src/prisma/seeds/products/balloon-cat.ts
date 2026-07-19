import { RewardType } from "@blacket/core";
import type { ProductSeed } from "../types";

export const balloonCatProduct: ProductSeed = {
    name: "Balloon Cat",
    price: 199,
    image: "{cdn}/content/blooks/Balloon Cat.png",
    color1: "#F21F0C",
    color2: "#C0190B",
    isQuantityCapped: false,
    isPriceUsingCrystals: true,
    store: "Blooks",
    rewards: {
        type: RewardType.BLOOK,
        quantity: 1,
        blook: "Balloon Cat"
    }
};

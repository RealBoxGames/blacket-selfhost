import { RewardType } from "@blacket/core";
import type { ProductSeed } from "../types";

export const sackOfCrystalsProduct: ProductSeed = {
    name: "Sack of Crystals",
    price: 9.99,
    image: "{cdn}/content/items/Sack of Crystals.png",
    color1: "#C383EA",
    color2: "#9358D6",
    isQuantityCapped: true,
    subname: "1,000 Crystals",
    store: "Crystals",
    rewards: {
        type: RewardType.CRYSTALS,
        quantity: 1000
    }
};

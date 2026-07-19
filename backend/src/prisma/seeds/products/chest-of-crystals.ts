import { RewardType } from "@blacket/core";
import type { ProductSeed } from "../types";

export const chestOfCrystalsProduct: ProductSeed = {
    name: "Chest of Crystals",
    price: 49.99,
    image: "{cdn}/content/items/Chest of Crystals.png",
    color1: "#C383EA",
    color2: "#9358D6",
    isQuantityCapped: true,
    subname: "6,000 Crystals",
    tag: "MOST POPULAR",
    subtag: "20% BONUS",
    store: "Crystals",
    rewards: {
        type: RewardType.CRYSTALS,
        quantity: 6000
    }
};

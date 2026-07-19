import { RewardType } from "@blacket/core";
import type { ProductSeed } from "../types";

export const handfulOfCrystalsProduct: ProductSeed = {
    name: "Handful of Crystals",
    price: 4.99,
    image: "{cdn}/content/items/Handful of Crystals.png",
    color1: "#C383EA",
    color2: "#9358D6",
    isQuantityCapped: true,
    subname: "500 Crystals",
    store: "Crystals",
    rewards: {
        type: RewardType.CRYSTALS,
        quantity: 500
    }
};

import { RewardType } from "@blacket/core";
import type { ProductSeed } from "../types";

export const boxOfCrystalsProduct: ProductSeed = {
    name: "Box of Crystals",
    price: 19.99,
    image: "{cdn}/content/items/Box of Crystals.png",
    color1: "#C383EA",
    color2: "#9358D6",
    isQuantityCapped: true,
    subname: "2,200 Crystals",
    subtag: "10% BONUS",
    store: "Crystals",
    rewards: {
        type: RewardType.CRYSTALS,
        quantity: 2200
    }
};

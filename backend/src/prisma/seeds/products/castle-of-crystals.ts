import { RewardType } from "@blacket/core";
import type { ProductSeed } from "../types";

export const castleOfCrystalsProduct: ProductSeed = {
    name: "Castle of Crystals",
    price: 199.99,
    image: "{cdn}/content/items/Castle of Crystals.png",
    color1: "#C383EA",
    color2: "#9358D6",
    isQuantityCapped: true,
    subname: "30,000 Crystals",
    tag: "BEST VALUE",
    subtag: "50% BONUS",
    store: "Crystals",
    rewards: {
        type: RewardType.CRYSTALS,
        quantity: 30000
    }
};

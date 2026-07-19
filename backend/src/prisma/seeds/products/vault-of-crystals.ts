import { RewardType } from "@blacket/core";
import type { ProductSeed } from "../types";

export const vaultOfCrystalsProduct: ProductSeed = {
    name: "Vault of Crystals",
    price: 99.99,
    image: "{cdn}/content/items/Vault of Crystals.png",
    color1: "#C383EA",
    color2: "#9358D6",
    isQuantityCapped: true,
    subname: "13,000 Crystals",
    subtag: "30% BONUS",
    store: "Crystals",
    rewards: {
        type: RewardType.CRYSTALS,
        quantity: 13000
    }
};

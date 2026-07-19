import { ItemType } from "@blacket/core";
import type { ItemSeed } from "../types";

export const personalNormalBoosterItem: ItemSeed = {
    name: "Personal Normal Booster",
    description: "Boosts normal pull odds for the player who activates it for 3 hours.",
    rarity: "Legendary",
    image: "{cdn}/content/items/placeholder.png",
    canUse: true,
    canTrade: true,
    canAuction: true,
    type: ItemType.BOOSTER,
    boosterDuration: 10_800,
    boosterMultiplier: 3
};

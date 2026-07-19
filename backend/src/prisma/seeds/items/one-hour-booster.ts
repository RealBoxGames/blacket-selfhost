import { ItemType } from "@blacket/core";
import type { ItemSeed } from "../types";

export const oneHourBoosterItem: ItemSeed = {
    name: "1 Hour Booster",
    description: "<red>test</red>",
    rarity: "Legendary",
    image: "{cdn}/content/items/1 Hour Booster.png",
    canUse: true,
    canTrade: true,
    canAuction: true,
    type: ItemType.BOOSTER,
    boosterDuration: 3600
};

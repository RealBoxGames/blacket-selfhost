import { useCallback } from "react";

import { Blook, Item, PrivateUser } from "@blacket/types";
import { ItemContainerOptions } from "../itemContainer.d";

export function useBlookVisibility(
    getBlookAmount: (blookId: number, shiny: boolean, user: PrivateUser) => number,
    mergedOptions: ItemContainerOptions,
    user: PrivateUser
) {
    return useCallback((blook: Blook) => {
        const amountNormal = getBlookAmount(blook.id, false, user);
        const amountShiny = getBlookAmount(blook.id, true, user);
        const locked = amountNormal <= 0;

        if (mergedOptions.rarities && !mergedOptions.rarities.includes(blook.rarityId)) return false;
        if (mergedOptions.searchQuery && !blook.name.toLowerCase().includes(mergedOptions.searchQuery.toLowerCase())) return false;

        if (!locked || (locked && mergedOptions.showLocked)) return true;
        if (amountShiny > 0 && mergedOptions.showShiny) return true;

        return false;
    }, [getBlookAmount, mergedOptions.rarities, mergedOptions.searchQuery, mergedOptions.showLocked, mergedOptions.showShiny, user]);
}

export function useItemVisibility(
    getItemAmount: (itemId: number, user: PrivateUser) => number,
    mergedOptions: ItemContainerOptions,
    user: PrivateUser
) {
    return useCallback((item: Item) => {
        const amount = getItemAmount(item.id, user);

        if (mergedOptions.searchQuery && !item.name.toLowerCase().includes(mergedOptions.searchQuery.toLowerCase())) return false;

        return amount > 0;
    }, [getItemAmount, mergedOptions.searchQuery, user]);
}

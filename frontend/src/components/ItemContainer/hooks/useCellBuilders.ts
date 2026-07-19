import { useCallback } from "react";
import { sizeOf } from "../utils";

import { Blook, Item, PrivateUser } from "@blacket/types";
import { FlatCell, ItemContainerOptions } from "../itemContainer.d";

export function useBuildCellsForBlook(
    getBlookAmount: (blookId: number, shiny: boolean, user: PrivateUser) => number,
    isBlookVisible: (blook: Blook) => boolean,
    mergedOptions: ItemContainerOptions,
    user: PrivateUser
) {
    return useCallback((blook: Blook): FlatCell[] => {
        if (!isBlookVisible(blook)) return [];

        const normalAmt = getBlookAmount(blook.id, false, user);
        const shinyAmt = getBlookAmount(blook.id, true, user);
        const locked = normalAmt <= 0;
        const { w, h } = sizeOf(blook);

        const cells: FlatCell[] = [];

        if (!(locked && !mergedOptions.showLocked)) {
            cells.push({
                key: `${blook.id}-n`,
                blook,
                shiny: false,
                amount: normalAmt,
                locked,
                userBlook: user.blooks.find((ub) => ub.blookId === blook.id && !ub.shiny) || null,
                w,
                h
            });
        }

        if (shinyAmt > 0 && mergedOptions.showShiny) {
            cells.push({
                key: `${blook.id}-s`,
                blook,
                shiny: true,
                amount: shinyAmt,
                locked: false,
                userBlook: user.blooks.find((ub) => ub.blookId === blook.id && ub.shiny) || null,
                w,
                h
            });
        }

        return cells;
    }, [getBlookAmount, isBlookVisible, mergedOptions.showLocked, mergedOptions.showShiny, user]);
}

export function useBuildCellsForItem(
    mergedOptions: ItemContainerOptions,
    user: PrivateUser
) {
    return useCallback((item: Item): FlatCell[] => {
        const userItems = user.items.filter((ui) => ui.itemId === item.id);

        if (mergedOptions.searchQuery && !item.name.toLowerCase().includes(mergedOptions.searchQuery.toLowerCase())) return [];

        if (userItems.length === 0) return [];

        const { w, h } = sizeOf(item);
        const cells: FlatCell[] = [];

        for (const userItem of userItems) {
            cells.push({
                key: `item-${userItem.id}`,
                item,
                shiny: false,
                amount: 1,
                locked: false,
                userItem,
                w,
                h
            });
        }

        return cells;
    }, [mergedOptions.searchQuery, user]);
}

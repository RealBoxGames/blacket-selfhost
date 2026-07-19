import { useCallback } from "react";

import { FlatCell, SortField, SortDirection, ItemContainerOptions } from "../itemContainer.d";

export function useSortCells(mergedOptions: ItemContainerOptions) {
    return useCallback((cells: FlatCell[]): FlatCell[] => {
        const sorted = [...cells];
        const { sortBy, sortDirection } = mergedOptions;

        if (!sortBy) return sorted;

        sorted.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            const aData = a.blook || a.item;
            const bData = b.blook || b.item;

            if (!aData || !bData) return 0;

            switch (sortBy) {
                case SortField.PRIORITY:
                    if (a.item && !b.item) return -1;
                    if (!a.item && b.item) return 1;
                    if (a.blook && b.blook) {
                        const priorityDiff = a.blook.priority - b.blook.priority;
                        if (priorityDiff !== 0) return priorityDiff;
                        return (a.shiny ? 1 : 0) - (b.shiny ? 1 : 0);
                    }
                    return 0;

                case SortField.NAME:
                    aValue = aData.name.toLowerCase();
                    bValue = bData.name.toLowerCase();
                    break;

                case SortField.RARITY:
                    aValue = aData.rarityId;
                    bValue = bData.rarityId;
                    break;

                case SortField.CHANCE:
                    aValue = a.blook?.chance ?? 0;
                    bValue = b.blook?.chance ?? 0;
                    break;

                default:
                    return 0;
            }

            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;

            return sortDirection === SortDirection.ASCENDING ? comparison : -comparison;
        });

        return sorted;
    }, [mergedOptions]);
}

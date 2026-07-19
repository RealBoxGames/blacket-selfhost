import { useCallback } from "react";
import { InventoryItem } from "../components";

import { BlookObtainMethodEnum } from "@blacket/types";
import { FlatCell, SelectedTypeEnum, TileRendererProps } from "../itemContainer.d";

export function useTileRenderer({ mergedOptions, user, onClick }: TileRendererProps) {
    const handleClick = useCallback((cell: FlatCell) => {
        if (!onClick || cell.amount <= 0) return;

        if (cell.userItem) {
            onClick({ type: SelectedTypeEnum.ITEM, item: cell.userItem });
        } else if (cell.userBlook) {
            onClick({ type: SelectedTypeEnum.BLOOK, item: cell.userBlook });
        }
    }, [onClick]);

    return useCallback((cell: FlatCell) => {
        const hasData = cell.userItem || cell.userBlook || cell.item || cell.blook;
        if (!hasData) return null;

        let blookToRender = cell.userBlook;
        const itemToRender = cell.userItem;

        if (cell.locked && cell.blook && !blookToRender) {
            blookToRender = {
                id: 0,
                userId: user.id,
                blookId: cell.blook.id,
                shiny: cell.shiny,
                serial: 0,
                obtainedBy: BlookObtainMethodEnum.UNKNOWN,
                initialObtainerId: user.id,
                sold: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        return <InventoryItem
            key={cell.key}
            blook={blookToRender}
            item={itemToRender}
            shiny={cell.shiny}
            locked={cell.locked}
            amount={cell.amount}
            useVhStyles={mergedOptions.useVhStyles}
            onClick={() => handleClick(cell)}
        />;
    }, [handleClick, mergedOptions.useVhStyles, user.id]);
}

import { useEffect, useMemo, useRef, useState } from "react";
import { type Collection as CollectionType, type List as ListType } from "react-virtualized";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useUser } from "@stores/UserStore/index";
import { DEFAULT_OPTIONS } from "./constants";
import { FlatRenderer, PackRenderer, useTileRenderer } from "./renderers";
import { useSortCells, useBlookVisibility, useItemVisibility, useBuildCellsForBlook, useBuildCellsForItem } from "./hooks";
import styles from "./itemContainer.module.scss";

import { ItemContainerProps, FlatCell } from "./itemContainer.d";

export default function ItemContainer({ user, options, onClick, ...props }: ItemContainerProps) {
    const { packs, blooks, items } = useData();
    const { resourceIdToPath } = useResource();
    const { getBlookAmount, getItemAmount } = useUser();

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    const sortCells = useSortCells(mergedOptions);
    const isBlookVisible = useBlookVisibility(getBlookAmount, mergedOptions, user);
    const isItemVisible = useItemVisibility(getItemAmount, mergedOptions, user);

    const buildCellsForBlook = useBuildCellsForBlook(getBlookAmount, isBlookVisible, mergedOptions, user);
    const buildCellsForItem = useBuildCellsForItem(mergedOptions, user);

    const visiblePacks = useMemo(() => {
        if (!mergedOptions.showPacks) return [];

        const visiblePacksList = [];

        if (mergedOptions.showItems && items.length > 0) {
            visiblePacksList.push(...items.some((item) => isItemVisible(item)) ? [{ id: -1, name: "", iconId: null }] : []);
        }

        if (mergedOptions.showBlooks) {
            visiblePacksList.push(...packs.filter((pack) => blooks.some((b) => b.packId === pack.id && isBlookVisible(b))));
        }

        return visiblePacksList;
    }, [
        mergedOptions.showBlooks, mergedOptions.showItems, mergedOptions.showPacks,
        packs, blooks, items,
        isBlookVisible, isItemVisible
    ]);

    // FLAT MODE
    const flatCells = useMemo<FlatCell[]>(() => {
        if (mergedOptions.showPacks) return [];

        const arr: FlatCell[] = [];

        if (mergedOptions.showItems) {
            for (const item of items) arr.push(...buildCellsForItem(item));
        }

        if (mergedOptions.showBlooks) {
            for (const blook of blooks) arr.push(...buildCellsForBlook(blook));
        }

        return sortCells(arr);
    }, [blooks, items, buildCellsForBlook, buildCellsForItem, mergedOptions.showBlooks, mergedOptions.showItems, mergedOptions.showPacks, sortCells]);

    // PACK MODE
    const packCellsMap = useMemo(() => {
        const map = new Map<number, FlatCell[]>();

        if (!mergedOptions.showPacks) return map;

        if (mergedOptions.showItems) {
            const itemCells: FlatCell[] = [];
            for (const item of items) itemCells.push(...buildCellsForItem(item));
            if (itemCells.length > 0) {
                map.set(-1, sortCells(itemCells));
            }
        }

        if (mergedOptions.showBlooks) {
            for (const pack of packs) {
                const packBlooks = blooks.filter((b) => b.packId === pack.id);
                const cells: FlatCell[] = [];

                for (const blook of packBlooks) cells.push(...buildCellsForBlook(blook));

                if (cells.length > 0) {
                    map.set(pack.id, sortCells(cells));
                }
            }
        }

        return map;
    }, [packs, blooks, items, buildCellsForBlook, buildCellsForItem, mergedOptions.showPacks, mergedOptions.showItems, mergedOptions.showBlooks, sortCells]);

    const flatRef = useRef<CollectionType | null>(null);
    const listRef = useRef<ListType | null>(null);
    const [flatWidth, setFlatWidth] = useState(0);
    const [listWidth, setListWidth] = useState(0);

    // recompute flat collection when width/data changes
    useEffect(() => {
        flatRef.current?.recomputeCellSizesAndPositions();
    }, [flatWidth, flatCells]);

    // recompute list heights when width/data changes
    useEffect(() => {
        listRef.current?.recomputeRowHeights();
        (listRef.current as any)?.forceUpdateGrid?.();
    }, [listWidth, visiblePacks, packCellsMap]);

    const renderTile = useTileRenderer({ mergedOptions, user, onClick });

    return (
        <div className={`${props.className ?? ""} ${styles.itemsContainer}`} style={props.style}>
            {(mergedOptions.showItems || mergedOptions.showBlooks) && (
                mergedOptions.showPacks ? (
                    <PackRenderer
                        visiblePacks={visiblePacks}
                        packCellsMap={packCellsMap}
                        listWidth={listWidth}
                        setListWidth={setListWidth}
                        listRef={listRef}
                        renderTile={renderTile}
                        resourceIdToPath={resourceIdToPath}
                    />
                ) : (
                    <FlatRenderer
                        flatCells={flatCells}
                        flatWidth={flatWidth}
                        setFlatWidth={setFlatWidth}
                        flatRef={flatRef}
                        renderTile={renderTile}
                    />
                )
            )}
        </div>
    );
}

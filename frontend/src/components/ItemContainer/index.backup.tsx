// import { useEffect, useMemo, useRef, useState } from "react";
// import { type Collection as CollectionType, type List as ListType } from "react-virtualized";

// import { useData } from "@stores/DataStore/index";
// import { useResource } from "@stores/ResourceStore/index";
// import { useUser } from "@stores/UserStore/index";
// import { DEFAULT_OPTIONS } from "./constants";
// import { FlatRenderer, PackRenderer, useTileRenderer } from "./renderers";
// import { useSortCells, useBlookVisibility, useItemVisibility, useBuildCellsForBlook, useBuildCellsForItem } from "./hooks";
// import styles from "./itemContainer.module.scss";

// import { ItemContainerProps, FlatCell } from "./itemContainer.d";

// export default function ItemContainer({ user, options, onClick, ...props }: ItemContainerProps) {
//     const { packs, blooks, items } = useData();
//     const { resourceIdToPath } = useResource();
//     const { getBlookAmount, getItemAmount } = useUser();

//     const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

//     const sortCells = useSortCells(mergedOptions);
//     const isBlookVisible = useBlookVisibility(getBlookAmount, mergedOptions, user);
//     const isItemVisible = useItemVisibility(getItemAmount, mergedOptions, user);

//     const visiblePacks = useMemo(() => {
//         if (!mergedOptions.showPacks) return [];

//         const visiblePacksList = [];

//         if (mergedOptions.showItems && items.length > 0) {
//             visiblePacksList.push(...items.some((item) => isItemVisible(item)) ? [{ id: -1, name: "", iconId: null }] : []);
//         }

//         if (mergedOptions.showBlooks) {
//             visiblePacksList.push(...packs.filter((pack) => blooks.some((b) => b.packId === pack.id && isBlookVisible(b))));
//         }

//         return visiblePacksList;
//     }, [
//         mergedOptions.showBlooks, mergedOptions.showItems, mergedOptions.showPacks,
//         packs, blooks, items,
//         isBlookVisible
//     ]);

//     const buildCellsForBlook = useCallback((blook: Blook): FlatCell[] => {
//         if (!isBlookVisible(blook)) return [];

//         const normalAmt = getBlookAmount(blook.id, false, user);
//         const shinyAmt = getBlookAmount(blook.id, true, user);
//         const locked = normalAmt <= 0;
//         const { w, h } = sizeOf(blook);

//         const cells: FlatCell[] = [];

//         if (!(locked && !mergedOptions.showLocked)) {
//             cells.push({
//                 key: `${blook.id}-n`,
//                 blook,
//                 shiny: false,
//                 amount: normalAmt,
//                 locked,
//                 userBlook: user.blooks.find((ub) => ub.blookId === blook.id && !ub.shiny) || null,
//                 w,
//                 h
//             });
//         }

//         if (shinyAmt > 0 && mergedOptions.showShiny) {
//             cells.push({
//                 key: `${blook.id}-s`,
//                 blook,
//                 shiny: true,
//                 amount: shinyAmt,
//                 locked: false,
//                 userBlook: user.blooks.find((ub) => ub.blookId === blook.id && ub.shiny) || null,
//                 w,
//                 h
//             });
//         }

//         return cells;
//     },
//         [getBlookAmount, isBlookVisible, mergedOptions.showLocked, mergedOptions.showShiny, user]
//     );

//     const buildCellsForItem = useCallback((item: Item): FlatCell[] => {
//         const userItems = user.items.filter((ui) => ui.itemId === item.id);

//         if (mergedOptions.searchQuery && !item.name.toLowerCase().includes(mergedOptions.searchQuery.toLowerCase())) return [];

//         // Don't show items if user doesn't have any
//         if (userItems.length === 0) return [];

//         const { w, h } = sizeOf(item);
//         const cells: FlatCell[] = [];

//         // Create a separate cell for each individual user item
//         for (const userItem of userItems) {
//             cells.push({
//                 key: `item-${userItem.id}`,
//                 item,
//                 shiny: false,
//                 amount: 1,
//                 locked: false,
//                 userItem,
//                 w,
//                 h
//             });
//         }

//         return cells;
//     },
//         [mergedOptions.searchQuery, user]
//     );

//     // FLAT MODE
//     const flatCells = useMemo<FlatCell[]>(() => {
//         if (mergedOptions.showPacks) return [];

//         const arr: FlatCell[] = [];

//         if (mergedOptions.showItems) {
//             for (const item of items) arr.push(...buildCellsForItem(item));
//         }

//         if (mergedOptions.showBlooks) {
//             for (const blook of blooks) arr.push(...buildCellsForBlook(blook));
//         }

//         // Apply sorting
//         return sortCells(arr);
//     }, [blooks, items, buildCellsForBlook, buildCellsForItem, mergedOptions.showBlooks, mergedOptions.showItems, mergedOptions.showPacks, sortCells]);

//     // PACK MODE
//     const packCellsMap = useMemo(() => {
//         const map = new Map<number, FlatCell[]>();
//     const buildCellsForBlook = useBuildCellsForBlook(getBlookAmount, isBlookVisible, mergedOptions, user);
//     const buildCellsForItem = useBuildCellsForItem(mergedOptions, user);      useVhStyles={mergedOptions.useVhStyles}
//             onClick={() => handleClick(cell)}
//         />;
//     }, [handleClick, mergedOptions.useVhStyles, user.id]);

//     // DO NOT REMOVE THIS
//     const flatRef = useRef<CollectionType | null>(null);
//     const listRef = useRef<ListType | null>(null);
//     const [flatWidth, setFlatWidth] = useState(0);
//     const [listWidth, setListWidth] = useState(0);

//     // recompute flat collection when width/data changes
//     useEffect(() => {
//         flatRef.current?.recomputeCellSizesAndPositions();
//     }, [flatWidth, flatCells]);

//     // recompute list heights when width/data changes
//     useEffect(() => {
//         listRef.current?.recomputeRowHeights();
//         (listRef.current as any)?.forceUpdateGrid?.();
//     }, [listWidth, visiblePacks, packCellsMap]);

//     const renderTile = useTileRenderer({ mergedOptions, user, onClick });er =>
//         ({ index, key, style }) => {
//             const pack = visiblePacks[index];
//             const cells = packCellsMap.get(pack.id) || [];
//             const { pos, totalH } = flowLayout(cells, width);

//             return (
//                 <div key={key} style={style} className={styles.setContainer}>
//                     <div className={styles.setTopContainer}>
//                         <div
//                             className={styles.setTopTile}
//                             style={{
//                                 backgroundImage: `url(${pack?.iconId
//                                     ? resourceIdToPath(pack.iconId)
//                                     : window.constructCDNUrl("/content/packs/icons/DefaultTiled.png")
//                                     })`
//                             }}
//                         />
//                         <div className={styles.setTopText}>
//                             {pack.id !== -1 ? `${pack.name} Pack` : "My Items"}
//                             <div className={styles.setGradient} />
//                         </div>
//                     </div>

//                     <div className={styles.setDivider} />

//                     <div className={styles.setContent} style={{ height: totalH }}>
//                         <Collection
//                             width={width}
//                             height={totalH}
//                             cellCount={pos.length}
//                             cellSizeAndPositionGetter={({ index }) => {
//                                 const p = pos[index];

//                                 return { width: p.w, height: p.h, x: p.x, y: p.y };
//                             }}
//                             cellRenderer={({ index, key: ckey, style: cstyle }) => {
//                                 const p = pos[index];

//                                 return (
//                                     <div key={ckey} style={cstyle}>
//                                         {renderTile(p)}
//                                     </div>
//                                 );
//                             }}
//                             style={{ outline: "none", overflowX: "hidden" }}
//                         />
//                     </div>
//                 </div>
//             );
//         };

//     const renderPacksList = () => <AutoSizer>
//         {({ width, height }) => {
//             if (width !== listWidth) setListWidth(width);

//             const rowHeights = visiblePacks.map((p) => {
//                 const cells = packCellsMap.get(p.id) || [];

//                 const { totalH } = flowLayout(cells, width);

//                 return PACK_HEADER_H + totalH;
//             });

//             return (
//                 <List
//                     ref={listRef}
//                     width={width}
//                     height={height}
//                     rowCount={visiblePacks.length}
//                     rowHeight={({ index }) => rowHeights[index] || PACK_HEADER_H}
//                     rowRenderer={makeRowRenderer(width)}
//                     style={{ outline: "none", overflowX: "hidden" }}
//                     overscanRowCount={2}
//                 />
//             );
//         }}
//     return (
//         <div className={`${props.className ?? ""} ${styles.itemsContainer}`} style={props.style}>
//             {(mergedOptions.showItems || mergedOptions.showBlooks) && (
//                 mergedOptions.showPacks ? (
//                     <PackRenderer
//                         visiblePacks={visiblePacks}
//                         packCellsMap={packCellsMap}
//                         listWidth={listWidth}
//                         setListWidth={setListWidth}
//                         listRef={listRef}
//                         renderTile={renderTile}
//                         resourceIdToPath={resourceIdToPath}
//                     />
//                 ) : (
//                     <FlatRenderer
//                         flatCells={flatCells}
//                         flatWidth={flatWidth}
//                         setFlatWidth={setFlatWidth}
//                         flatRef={flatRef}
//                         renderTile={renderTile}
//                     />
//                 )
//             )}
//         </div>
//     );
// }
import { AutoSizer, List, Collection, type ListRowRenderer } from "react-virtualized";
import { flowLayout } from "../utils";
import { PACK_HEADER_H } from "../constants";
import styles from "../itemContainer.module.scss";

import { PackRendererProps } from "../itemContainer.d";

export function PackRenderer({
    visiblePacks,
    packCellsMap,
    listWidth,
    setListWidth,
    listRef,
    renderTile,
    resourceIdToPath
}: PackRendererProps) {
    const makeRowRenderer = (width: number): ListRowRenderer =>
        ({ index, key, style }) => {
            const pack = visiblePacks[index];
            const cells = packCellsMap.get(pack.id) || [];
            const { pos, totalH } = flowLayout(cells, width);

            return (
                <div key={key} style={style} className={styles.setContainer}>
                    <div className={styles.setTopContainer}>
                        <div
                            className={styles.setTopTile}
                            style={{
                                backgroundImage: `url(${pack?.iconId
                                    ? resourceIdToPath(pack.iconId)
                                    : window.constructCDNUrl("/content/packs/icons/DefaultTiled.png")
                                    })`
                            }}
                        />
                        <div className={styles.setTopText}>
                            {pack.id !== -1 ? `${pack.name} Pack` : "My Items"}
                            <div className={styles.setGradient} />
                        </div>
                    </div>

                    <div className={styles.setDivider} />

                    <div className={styles.setContent} style={{ height: totalH }}>
                        <Collection
                            width={width}
                            height={totalH}
                            cellCount={pos.length}
                            cellSizeAndPositionGetter={({ index }) => {
                                const p = pos[index];
                                return { width: p.w, height: p.h, x: p.x, y: p.y };
                            }}
                            cellRenderer={({ index, key: ckey, style: cstyle }) => {
                                const p = pos[index];
                                return (
                                    <div key={ckey} style={cstyle}>
                                        {renderTile(p)}
                                    </div>
                                );
                            }}
                            style={{ outline: "none", overflowX: "hidden" }}
                        />
                    </div>
                </div>
            );
        };

    return (
        <AutoSizer>
            {({ width, height }) => {
                if (width !== listWidth) setListWidth(width);

                const rowHeights = visiblePacks.map((p) => {
                    const cells = packCellsMap.get(p.id) || [];
                    const { totalH } = flowLayout(cells, width);
                    return PACK_HEADER_H + totalH;
                });

                return (
                    <List
                        ref={listRef}
                        width={width}
                        height={height}
                        rowCount={visiblePacks.length}
                        rowHeight={({ index }) => rowHeights[index] || PACK_HEADER_H}
                        rowRenderer={makeRowRenderer(width)}
                        style={{ outline: "none", overflowX: "hidden" }}
                        overscanRowCount={2}
                    />
                );
            }}
        </AutoSizer>
    );
}

import { AutoSizer, Collection, type CollectionCellSizeAndPositionGetter } from "react-virtualized";

import { FlatRendererProps } from "../itemContainer.d";
import { flowLayout } from "../utils";

export function FlatRenderer({ flatCells, flatWidth, setFlatWidth, flatRef, renderTile }: FlatRendererProps) {
    return (
        <AutoSizer>
            {({ width, height }) => {
                if (width !== flatWidth) setFlatWidth(width);

                const { pos } = flowLayout(flatCells, width);

                const cellSizeAndPositionGetter: CollectionCellSizeAndPositionGetter = ({ index }) => {
                    const p = pos[index];
                    return { width: p.w, height: p.h, x: p.x, y: p.y };
                };

                return (
                    <Collection
                        ref={flatRef}
                        width={width}
                        height={height}
                        cellCount={pos.length}
                        cellSizeAndPositionGetter={cellSizeAndPositionGetter}
                        cellRenderer={({ index, key, style }) => {
                            const p = pos[index];
                            return (
                                <div key={key} style={style}>
                                    {renderTile(p)}
                                </div>
                            );
                        }}
                        style={{ outline: "none", overflowX: "hidden" }}
                        verticalOverscanSize={300}
                    />
                );
            }}
        </AutoSizer>
    );
}

import {
    FlatCell,
    PositionedCell
} from "../itemContainer.d";

const GAP = 10;

export function flowLayout(cells: FlatCell[], containerW: number) {
    const maxW = Math.max(1, containerW);
    let x = 0;
    let y = 0;
    let rowH = 0;
    const placed: PositionedCell[] = [];

    for (const c of cells) {
        const { w, h } = c;

        // wrap to new row
        if (x > 0 && x + w > maxW) {
            x = 0;
            y += rowH + GAP;
            rowH = 0;
        }

        placed.push({ ...c, x, y });
        x += w + GAP;
        rowH = Math.max(rowH, h);
    }

    const totalH = cells.length ? y + rowH : 0;

    return { pos: placed, totalH };
}

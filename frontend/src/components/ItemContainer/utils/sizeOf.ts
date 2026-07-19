import { Blook, Item } from "@blacket/types";

const SMALL_W = 60;
const SMALL_H = 70;
const FIXED_SMALL_W = 60;
const FIXED_SMALL_H = 60;
const BIG_W = SMALL_W * 1.4;
const BIG_H = SMALL_H * 1.4;

export function sizeOf(blookOrItem: Blook | Item) {
    if ("isBig" in blookOrItem) {
        return blookOrItem.isBig ? { w: BIG_W, h: BIG_H } : { w: SMALL_W, h: SMALL_H };
    }

    return { w: FIXED_SMALL_W, h: FIXED_SMALL_H };
}

import { UserBlook, UserItem } from "@blacket/types";
import { HTMLAttributes } from "react";

export interface InventoryItemProps extends HTMLAttributes<HTMLDivElement> {
    blook?: UserBlook | null;
    item?: UserItem | null;
    shiny?: boolean;
    locked?: boolean;
    amount?: number;
    selectable?: boolean;
    useVhStyles?: boolean;
}

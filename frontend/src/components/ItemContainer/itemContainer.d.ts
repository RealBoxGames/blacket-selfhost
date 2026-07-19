import { HTMLAttributes } from "react";
import { Item, PrivateUser, UserBlook, UserItem } from "@blacket/types";

export type FlatCell = {
    key: string; // stable key for the visual cell
    blook?: Blook;
    item?: Item;
    shiny: boolean;
    amount: number;
    locked: boolean;
    userBlook?: UserBlook | null;
    userItem?: UserItem | null;
    w: number;
    h: number;
};

export type PositionedCell = FlatCell & { x: number; y: number };

export enum SortField {
    PRIORITY = 1,
    NAME = 2,
    RARITY = 3,
    CHANCE = 4
}

export enum SortDirection {
    ASCENDING = 1,
    DESCENDING = 2
}

export interface ItemContainerOptions {
    showItems?: boolean;
    showBlooks?: boolean;
    showShiny?: boolean;
    showLocked?: boolean;
    showPacks?: boolean;

    rarities?: number[];
    searchQuery?: string;

    sortBy?: SortField;
    sortDirection?: SortDirection;

    useVhStyles?: boolean;
}

export enum SelectedTypeEnum {
    BLOOK,
    ITEM
}

export interface ItemClickEvent {
    type: SelectedTypeEnum;
    item?: UserBlook | UserItem | null;
}

export interface ItemContainerProps extends HTMLAttributes<HTMLDivElement> {
    user: PrivateUser;
    options?: ItemContainerOptions;
    onClick?: (item: ItemClickEvent) => void;
}

export interface TileRendererProps {
    mergedOptions: ItemContainerOptions;
    user: PrivateUser;
    onClick?: (item: ItemClickEvent) => void;
}

export interface FlatRendererProps {
    flatCells: FlatCell[];
    flatWidth: number;
    setFlatWidth: (width: number) => void;
    flatRef: React.MutableRefObject<any>;
    renderTile: (cell: FlatCell) => JSX.Element | null;
}

export interface PackRendererProps {
    visiblePacks: any[];
    packCellsMap: Map<number, FlatCell[]>;
    listWidth: number;
    setListWidth: (width: number) => void;
    listRef: React.MutableRefObject<any>;
    renderTile: (cell: FlatCell) => JSX.Element | null;
    resourceIdToPath: (id: number) => string;
}

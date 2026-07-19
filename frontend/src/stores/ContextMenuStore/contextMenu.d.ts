import { CSSProperties, ReactNode } from "react";

export interface ContextMenuStore {
    contextMenu: ContextMenu | null;
    setContextMenu: (contextMenu: ContextMenu | null) => void;
    openContextMenu: (items: ContextMenu["items"]) => void;
    closeContextMenu: () => void;
}

export interface ContextMenuItem {
    divider?: boolean;
    icon?: string;
    image?: string;
    color?: string;
    onClick?: () => void;
    label?: string;
}

export interface ContextMenu {
    items: Array<ContextMenuItem | null | undefined>;
    x: number;
    y: number;
}

export interface ContainerProps {
    top: CSSProperties["top"];
    left: CSSProperties["left"];
    children: ReactNode;
    className?: string;
}

export interface ItemProps {
    icon?: string;
    image?: string;
    color?: string;
    children: ReactNode;
    onClick: () => void;
}

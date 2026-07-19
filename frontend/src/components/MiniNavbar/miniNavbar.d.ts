import { HTMLAttributes } from "react";

export interface MiniNavbarItem {
    icon?: string;
    text: string;
    element?: any;
    path?: string;
    active?: boolean;
    onClick?: () => void;
}

export interface MiniNavbarProps extends HTMLAttributes<HTMLDivElement> {
    items: MiniNavbarItem[];
    mobileIconOnly?: boolean;
}

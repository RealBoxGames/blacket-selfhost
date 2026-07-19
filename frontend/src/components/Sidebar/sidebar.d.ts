import { PermissionTypeEnum } from "@blacket/types";

export interface Page {
    icon: string;
    text: string;
    link: string;
    permission?: PermissionTypeEnum;
    textSizeOverride?: number;
    isChat?: boolean;
}

export interface PageItemProps {
    page: Page;
    location: string;
    mentions: number;
    onClick?: () => void;
}

export interface BottomPageItemProps {
    page: Page;
    onClick?: () => void;
}

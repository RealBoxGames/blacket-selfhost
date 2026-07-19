import { PermissionType } from "@blacket/core";
import type { GroupSeed } from "../types";
import { vipGroup } from "./vip";

export const mvpGroup: GroupSeed = {
    name: "MVP",
    permissions: [
        ...vipGroup.permissions,
        PermissionType.CHANGE_NAME_COLOR_TIER_2,
        PermissionType.CUSTOM_TRADING_TABLE_COLOR,
        PermissionType.CUSTOM_AVATAR,
        PermissionType.CUSTOM_BANNER,
        PermissionType.EARLY_UPDATES,
        PermissionType.UPLOAD_FILES_LARGE,
        PermissionType.MORE_AUCTIONS_TIER_2,
        PermissionType.MORE_CHAT_BADGE_TIER_2
    ],
    image: "{cdn}/content/badges/MVP.png",
    priority: 2
};
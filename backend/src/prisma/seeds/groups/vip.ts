import { PermissionType } from "@blacket/core";
import type { GroupSeed } from "../types";

export const vipGroup: GroupSeed = {
    name: "VIP",
    permissions: [
        PermissionType.CHANGE_NAME_COLOR_TIER_1,
        PermissionType.USE_CHAT_COLORS,
        PermissionType.UPLOAD_FILES_SMALL,
        PermissionType.MORE_AUCTIONS_TIER_1,
        PermissionType.MORE_CHAT_BADGE_TIER_1,
        PermissionType.LESS_AUCTION_TAX
    ],
    image: "{cdn}/content/badges/VIP.png",
    priority: 1
};

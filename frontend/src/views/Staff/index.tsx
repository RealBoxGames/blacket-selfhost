import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import styles from "./staff.module.scss";

import { PermissionTypeEnum } from "@blacket/types";
import { isOwnerTier } from "@functions/staff/isOwnerTier";

interface PanelTile {
    icon: string;
    text: string;
    description: string;
    link: string;
    visible: boolean;
}

export default function StaffPanel() {
    const { user } = useUser();
    const navigate = useNavigate();

    if (!user || !user.hasPermission(PermissionTypeEnum.MUTE_USERS)) return <Navigate to="/login" />;

    const isOwnerOrDev = isOwnerTier(user);
    const hasManageData = user.hasPermission(PermissionTypeEnum.MANAGE_DATA);

    const TILES: PanelTile[] = [
        {
            icon: "fas fa-shield-halved",
            text: "Moderation",
            description: "Ban, mute, and IP-ban users.",
            link: "/staff/moderation",
            visible: user.hasPermission(PermissionTypeEnum.MUTE_USERS)
        },
        {
            icon: "fas fa-user-gear",
            text: "User Manager",
            description: "Search users, edit roles, currency, and cosmetics.",
            link: "/staff/users",
            visible: hasManageData
        },
        {
            icon: "fas fa-dragon",
            text: "Blooks",
            description: "Create and edit blooks.",
            link: "/staff/blooks",
            visible: hasManageData
        },
        {
            icon: "fas fa-box-open",
            text: "Packs",
            description: "Create and edit packs.",
            link: "/staff/packs",
            visible: hasManageData
        },
        {
            icon: "fas fa-newspaper",
            text: "News",
            description: "Post news updates.",
            link: "/staff/news",
            visible: hasManageData
        },
        {
            icon: "fas fa-bolt",
            text: "Boosters",
            description: "Activate and manage global boosters.",
            link: "/staff/boosters",
            visible: hasManageData
        }
    ];

    return (
        <div className={styles.panel}>
            {isOwnerOrDev && <div className={styles.panelBadge}>Owner / Developer Access</div>}

            <div className={styles.panelGrid}>
                {TILES.filter((tile) => tile.visible).map((tile) => (
                    <div key={tile.link} className={styles.panelTile} onClick={() => navigate(tile.link)}>
                        <i className={tile.icon} />

                        <div className={styles.panelTileText}>
                            <div className={styles.panelTileTitle}>{tile.text}</div>
                            <div className={styles.panelTileDescription}>{tile.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

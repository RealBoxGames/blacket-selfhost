import { useState, memo, useMemo, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useChat } from "@stores/ChatStore/index";
import { PageItem, BottomPageItem } from "./components/index";
import styles from "./sidebar.module.scss";

import { Page } from "./sidebar.d";
import { PermissionTypeEnum } from "@blacket/types";

const PAGES: { left: Page[]; bottom: Page[] } = {
    left: [
        {
            icon: "fas fa-home",
            text: "Dashboard",
            link: "/dashboard"
        },
        {
            icon: "fas fa-trophy",
            text: "Leaderboard",
            link: "/leaderboard",
            textSizeOverride: 18
        },
        {
            icon: "fas fa-comments",
            text: "Chat",
            link: "/chat",
            isChat: true
        },
        {
            icon: "fas fa-envelope",
            text: "Direct Messages",
            link: "/direct-messages",
            textSizeOverride: 16
        },
        {
            icon: "fas fa-scale-balanced",
            text: "Trading Plaza",
            link: "/trading-plaza",
            textSizeOverride: 18
        },
        {
            icon: "fas fa-swords",
            text: "Clans",
            link: "/clans"
        },
        {
            icon: "fas fa-store",
            text: "Market",
            link: "/market"
        },
        {
            icon: "fas fa-box-open",
            text: "Inventory",
            link: "/inventory"
        },
        {
            icon: "fas fa-building-columns",
            text: "Auction House",
            link: "/auction-house",
            textSizeOverride: 17
        },
        {
            icon: "fas fa-newspaper",
            text: "News",
            link: "/news"
        },
        {
            icon: "fas fa-cog",
            text: "Settings",
            link: "/settings"
        }
    ],
    bottom: [
        {
            icon: "fas fa-heart",
            text: "Credits",
            link: "/credits"
        },
        {
            icon: "fab fa-discord",
            text: "Discord",
            link: "/discord"
        },
        {
            icon: "fab fa-git-alt",
            text: "Codeberg",
            link: "/codeberg"
        },
        {
            icon: "fab fa-youtube",
            text: "YouTube",
            link: "/youtube"
        },
        {
            icon: "fab fa-x-twitter",
            text: "X",
            link: "/x"
        }
    ]
};

const STAFF_PAGES: Page[] = [
    {
        icon: "fas fa-shield-halved",
        text: "Panel",
        link: "/staff",
        permission: PermissionTypeEnum.MUTE_USERS
    }
];

export default memo(function Sidebar() {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

    const location = useLocation().pathname.split("/")[1];

    const { user } = useUser();
    const { mentions } = useChat();

    const handleMobileSidebarOpen = useCallback(() => {
        setMobileSidebarOpen(true);
    }, []);

    const handleMobileSidebarClose = useCallback(() => {
        setMobileSidebarOpen(false);
    }, []);

    const hasStaffPermission = useMemo(() =>
        user?.hasPermission(PermissionTypeEnum.MUTE_USERS) || false,
        [user]
    );

    const visibleStaffPages = useMemo(() =>
        STAFF_PAGES.filter((page) => !page.permission || user?.hasPermission(page.permission)),
        [user]
    );

    const pageScrollerHeight = useMemo(() =>
        hasStaffPermission ? "60%" : undefined,
        [hasStaffPermission]
    );

    if (!user) return null;

    return (
        <>
            <div className={styles.sidebar}>
                <Link className={styles.header} to="/dashboard">
                    {import.meta.env.VITE_INFORMATION_NAME}
                </Link>

                <div className={styles.pageScroller} style={{ height: pageScrollerHeight }}>
                    {PAGES.left.map((page, index) => (
                        <PageItem
                            key={index}
                            page={page}
                            location={location}
                            mentions={page.isChat ? mentions : 0}
                        />
                    ))}
                </div>

                {hasStaffPermission && (
                    <div className={styles.pageScrollerStaff}>
                        {visibleStaffPages.map((page, index) => (
                            <PageItem
                                key={index}
                                page={page}
                                location={location}
                                mentions={0}
                            />
                        ))}
                    </div>
                )}

                <div className={styles.bottom}>
                    <div className={styles.bottomItems}>
                        {PAGES.bottom.map((page, index) => (
                            <BottomPageItem
                                key={index}
                                page={page}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <i
                className={`${styles.mobileHamburgerIcon} fas fa-bars`}
                onClick={handleMobileSidebarOpen}
            />

            {mobileSidebarOpen && (
                <div
                    className={styles.mobileSidebarModal}
                    onClick={handleMobileSidebarClose}
                />
            )}

            <div className={styles.mobileSidebar} data-open={mobileSidebarOpen}>
                <i
                    className={`${styles.mobileCloseIcon} fas fa-times`}
                    onClick={handleMobileSidebarClose}
                />

                {PAGES.left.map((page, index) => (
                    <PageItem
                        key={index}
                        page={page}
                        location={location}
                        mentions={page.isChat ? mentions : 0}
                        onClick={handleMobileSidebarClose}
                    />
                ))}

                {hasStaffPermission && STAFF_PAGES.map((page, index) => (
                    <PageItem
                        key={index}
                        page={page}
                        location={location}
                        mentions={0}
                        onClick={handleMobileSidebarClose}
                    />
                ))}

                <div className={styles.bottom}>
                    <div className={styles.bottomItems}>
                        {PAGES.bottom.map((page, index) => (
                            <BottomPageItem
                                key={index}
                                page={page}
                                onClick={handleMobileSidebarClose}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
});

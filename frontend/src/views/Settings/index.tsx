import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { MiniNavbar } from "@components/index";
import { Section } from "./components/index";
import styles from "./settings.module.scss";

import { MiniNavbarItem } from "@components/MiniNavbar/miniNavbar.d";

export default function Settings() {
    const { user } = useUser();
    if (!user) return <Navigate to="/login" />;

    const location = useLocation();

    const NAVBAR: MiniNavbarItem[] = [
        {
            icon: "fas fa-user",
            text: "Account",
            path: "/settings/account",
            element: Section.Account
        },
        {
            icon: "fas fa-user-friends",
            text: "Social",
            path: "/settings/social",
            element: Section.Social
        },
        {
            icon: "fas fa-wallet",
            text: "Billing",
            path: "/settings/billing"
        },
        {
            icon: "fas fa-shield-alt",
            text: "Security",
            path: "/settings/security",
            element: Section.Security
        },
        {
            icon: "fas fa-palette",
            text: "Cosmetics",
            path: "/settings/cosmetics",
            element: Section.Cosmetics
        },
        {
            icon: "fas fa-info-circle",
            text: "Legal",
            path: "/settings/legal",
            element: Section.Legal
        }
    ];

    if (location.pathname === "/settings") return <Navigate to={NAVBAR[0]?.path || "/settings"} />;

    const currentSection = NAVBAR.find((item) => item.path === location.pathname);
    if (!currentSection) return <Navigate to="/settings" />;

    return (
        <>
            <MiniNavbar
                items={NAVBAR}
                className={styles.navbar}
            />

            <div className={styles.container}>
                <currentSection.element />
            </div>
        </>
    );
}

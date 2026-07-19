import { useEffect, memo, useMemo } from "react";
import { useUser } from "@stores/UserStore/index";
import { ExperienceBalance, CrystalBalance, TokenBalance, UserDropdown, DiamondBalance } from "./components/index";
import styles from "./topRight.module.scss";

import { TopRightProps } from "./topRight.d";

const MemoizedExperienceBalance = memo(ExperienceBalance);
const MemoizedCrystalBalance = memo(CrystalBalance);
const MemoizedDiamondBalance = memo(DiamondBalance);
const MemoizedTokenBalance = memo(TokenBalance);
const MemoizedUserDropdown = memo(UserDropdown);

export default memo(function TopRight({ content, desktopOnly = false }: TopRightProps) {
    const { user } = useUser();

    const showExperience = useMemo(() => content.includes("experience"), [content]);
    const showCrystals = useMemo(() => content.includes("crystals"), [content]);
    const showDiamonds = useMemo(() => content.includes("diamonds"), [content]);
    const showTokens = useMemo(() => content.includes("tokens"), [content]);

    useEffect(() => {
        document.body.setAttribute("has-top-right", "true");

        return () => {
            document.body.removeAttribute("has-top-right");
        };
    }, []);

    if (!user) return null;

    return (
        <div className={styles.container} data-desktop-only={desktopOnly}>
            {showExperience && <MemoizedExperienceBalance user={user} />}
            {showCrystals && <MemoizedCrystalBalance user={user} />}
            {showDiamonds && <MemoizedDiamondBalance user={user} />}
            {showTokens && <MemoizedTokenBalance user={user} />}

            <MemoizedUserDropdown user={user} />
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.content === nextProps.content &&
        prevProps.desktopOnly === nextProps.desktopOnly
    );
});

import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import styles from "../sidebar.module.scss";

import { PageItemProps } from "../sidebar.d";

export default memo(function PageItem({ page, location, mentions, onClick }: PageItemProps) {
    const handleClick = useCallback(() => {
        onClick?.();
    }, [onClick]);

    return (
        <Link
            data-active={location === page.link.slice(1)}
            className={styles.page}
            to={page.link}
            onClick={handleClick}
        >
            <i className={`${styles.pageIcon} ${page.icon}`} />
            <div
                className={styles.pageText}
                style={{ fontSize: page.textSizeOverride || 20 }}
            >
                {page.text}
            </div>

            {page.isChat && mentions > 0 && (
                <div className={styles.notificationIndicator}>
                    <div>{mentions}</div>
                </div>
            )}
        </Link>
    );
});

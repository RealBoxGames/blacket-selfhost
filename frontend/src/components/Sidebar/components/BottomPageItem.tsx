import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import styles from "../sidebar.module.scss";

import { BottomPageItemProps } from "../sidebar.d";

export default memo(function BottomPageItem({ page, onClick }: BottomPageItemProps) {
    const handleClick = useCallback(() => {
        onClick?.();
    }, [onClick]);

    return (
        <Link
            className={styles.bottomPage}
            to={page.link}
            data-tooltip-id={page.link}
            onClick={handleClick}
        >
            <Tooltip id={page.link} place="top">{page.text}</Tooltip>
            <i className={`${styles.bottomPageIcon} ${page.icon}`} />
        </Link>
    );
});

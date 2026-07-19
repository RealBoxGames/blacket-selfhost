import { forwardRef, ForwardedRef } from "react";
import styles from "../contextMenu.module.scss";

import { ContainerProps } from "../contextMenu.d";

export const Container = forwardRef(({ top, left, children, className }: ContainerProps, ref: ForwardedRef<HTMLDivElement>) => (
    <>
        <div className={styles.mobileModal} />
        <div
            ref={ref}
            className={`${styles.container} ${className || ""}`}
            style={{ top, left }}
            onContextMenu={(e) => e.preventDefault()}
            data-context-menu
        >
            {children}
        </div>
    </>
));

export default Container;

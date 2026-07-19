import { Link } from "react-router-dom";
import styles from "./miniNavbar.module.scss";

import { MiniNavbarProps } from "./miniNavbar.d";

export default function MiniNavbar({ items, mobileIconOnly = true, className, ...props }: MiniNavbarProps) {
    const mobile = window.innerWidth <= 768;

    return (
        <div className={`${styles.navbar} ${className || ""}`} {...props}>
            {items.map((item, index) => item.path ?
                <Link
                    key={index}
                    to={item.path}
                    className={styles.navbarItem}
                    data-active={location.pathname === item.path}
                    onClick={item.onClick}
                >
                    {item.icon && <i className={item.icon} />}
                    {!(mobile && mobileIconOnly) && item.text}
                </Link>

                :

                <div
                    key={index}
                    className={styles.navbarItem}
                    data-active={String(item.active)}
                    onClick={item.onClick}
                >
                    {item.icon && <i className={item.icon} />}
                    {!(mobile && mobileIconOnly) && item.text}
                </div>
            )}
        </div>
    );
}

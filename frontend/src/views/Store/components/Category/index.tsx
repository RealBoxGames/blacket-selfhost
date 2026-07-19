import styles from "./category.module.scss";

import { CategoryProps } from "../../store.d";

export default function Category({ title, subTitle, spaceEvenly = false, rightChildren, children }: CategoryProps) {
    return (
        <div className={styles.container}>
            <div className={styles.top}>
                <div className={styles.topText}>
                    <div className={styles.title}>{title}</div>
                    <div className={styles.subTitle}>{subTitle}</div>
                </div>

                {rightChildren && <div className={styles.right}>{rightChildren}</div>}
            </div>

            <div className={styles.divider} />

            <div className={styles.products} style={spaceEvenly ? { justifyContent: "space-evenly" } : {}}>
                {children}
            </div>
        </div>
    );
}

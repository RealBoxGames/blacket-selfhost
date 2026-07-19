import { LoaderProps } from "./loader.d";
import styles from "./loader.module.scss";

export default function Loader({ motionless = false, noModal = false, message, className = "", ...props }: LoaderProps) {
    if (className !== "") className = ` ${className}`;

    if (!noModal) return (
        <div className={styles.loadingModal}>
            <div className={`${styles.loader}${className}`} style={message ? { marginBottom: 100 } : {}} {...props}>
                <div className={styles.loaderSpinner} data-motionless={motionless} />
            </div>

            {message && <div className={styles.loaderMessage}>{message}</div>}
        </div>
    );

    else return (
        <div className={`${styles.loader}${className}`} {...props}>
            <div className={styles.loaderSpinner} data-motionless={motionless} />

            {message && <div className={styles.loaderMessage}>{message}</div>}
        </div>
    );
}

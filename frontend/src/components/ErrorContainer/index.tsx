import styles from "./errorContainer.module.scss";

import { ErrorContainerProps } from "./errorContainer.d";

export default function ErrorContainer({ children, ...props }: ErrorContainerProps) {
    return (
        <div className={styles.errorContainer} {...props}>
            <i className="fas fa-times-circle" />
            <div>{children}</div>
        </div>
    );
}

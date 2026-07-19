import { Loader } from "@components/index";
import { ModalButtonContainerProps } from "./modalButtonContainer.d";

import styles from "./modalButtonContainer.module.scss";

export default function ModalButtonContainer({ loading = false, children, ...props }: ModalButtonContainerProps) {
    return <div className={styles.buttonContainer} data-loading={loading} {...props}>{loading ? <Loader noModal={true} className={styles.loader} /> : children}</div>;
}

import { Button } from "@components/index";
import styles from "../account.module.scss";

import { UpgradeButtonProps } from "../account.d";

export default function UpgradeButton({ children, ...props }: UpgradeButtonProps) {
    return <Button.GenericButton to="/store" icon="fas fa-arrow-up" className={styles.upgradeButton} {...props}>{children}</Button.GenericButton>;
}

import { ReactNode } from "react";
import styles from "../account.module.scss";

export default function PlanText({ children }: { children: ReactNode }) {
    return (
        <div className={styles.planText}>
            <div>{import.meta.env.VITE_INFORMATION_NAME}</div>
            <div>{children}</div>
        </div>
    );
}

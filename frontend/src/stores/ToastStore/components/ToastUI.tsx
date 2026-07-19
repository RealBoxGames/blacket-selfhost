import { useEffect } from "react";
import { useToastLoop } from "../useToastLoop";
import { useToast } from "@stores/ToastStore/index";
import { useSound } from "@stores/SoundStore/index";
import { ImageOrVideo } from "@components/index";
import styles from "../toast.module.scss";

export default function ToastUI() {
    useToastLoop();

    const { toasts, closeToast } = useToast();
    const { playSound } = useSound();

    const toast = toasts[0];

    useEffect(() => {
        if (toast && !toast.closing) playSound(toast.sound || "notification");

        setTimeout(() => {
            if (toast) closeToast(toast.id!);
        }, toast?.expires);
    }, [toast]);

    if (!toast) return null;

    return (
        <div
            className={styles.toastContainer}
            data-closing={toast.closing}
            onClick={() => {
                toast.onClick?.();

                closeToast(toast.id!);
            }}
        >
            <div className={styles.toast}>
                {toast.icon && (
                    <div className={styles.leftSide}>
                        <div className={styles.toastIcon}>
                            {toast.icon.startsWith("fa") ? (
                                <i className={toast.icon} />
                            ) : (
                                <ImageOrVideo
                                    className={styles.toastIconImage}
                                    src={toast.icon}
                                    alt="Toast Icon"
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.rightSide}>
                    <div className={styles.toastHeader}>{toast.header}</div>
                    <div className={styles.toastBody}>{toast.body}</div>
                </div>
            </div>
        </div>
    );
}

import styles from "./paymentMethodText.module.scss";

import { PaymentMethodTextProps } from "./paymentMethodText.d";
import { PaymentMethodTypeEnum } from "@blacket/types";

export default function PaymentMethodText({ paymentMethod }: PaymentMethodTextProps) {
    const paymentMethodString = paymentMethod?.value ?? null;

    let icon: string;

    switch (paymentMethod?.type) {
        case PaymentMethodTypeEnum.CARD:
            icon = "fas fa-credit-card";
            break;
        case PaymentMethodTypeEnum.CASHAPP:
            icon = "fas fa-dollar-sign";
            break;
        case PaymentMethodTypeEnum.PAYPAL:
            icon = "fab fa-paypal";
            break;
        default:
            icon = "fas fa-question-circle";
            break;
    }

    return (
        <span className={styles.text}>
            {paymentMethodString && <i className={icon} />}
            {paymentMethodString ?? "Add Payment Method"}
        </span>
    );
}

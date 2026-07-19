import { StripeProductEntity } from "@blacket/types";

export interface ProductPurchaseModalProps {
    product: StripeProductEntity;
}

export interface ProductSuccessModalProps {
    product: StripeProductEntity;
    quantity: number;
}

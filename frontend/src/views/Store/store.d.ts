import { HTMLAttributes, ReactNode } from "react";
import { BillingIntervalEnum, StripeProductEntity, StripeSubscriptionEntity } from "@blacket/types";

export interface CategoryProps {
    title: string;
    subTitle: string;
    spaceEvenly?: boolean;
    rightChildren?: ReactNode;
    children?: ReactNode;
}

export interface PriceProps {
    price: number;
    discount?: number;
    isSubPrice?: boolean;
    isPriceUsingCrystals: boolean;
    strikethrough?: boolean;
}

export interface ProductProps extends HTMLAttributes<HTMLDivElement> {
    product: StripeProductEntity;
}

export interface ProductModalProps {
    product: StripeProductEntity;
}

export interface SubscriptionProps {
    subscription: StripeSubscriptionEntity;
    interval?: BillingIntervalEnum;
}

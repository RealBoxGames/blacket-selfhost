import { UserSubscription } from "../../../interfaces";

export interface PublicUserSubscription extends Omit<
    UserSubscription,
    "id" | "ipAddressId" | "userId" | "stripeSubscriptionId" | "product"
> { }

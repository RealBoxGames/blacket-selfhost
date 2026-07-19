export enum InternalServerError {
    DEFAULT = "Something went wrong.",
    STRIPE_SUBSCRIPTION_USING_CRYSTALS = "This product is setup incorrectly and cannot be purchased with crystals.",
    STRIPE_REFUND_FAILED = "Failed to process refund for subscription."
};

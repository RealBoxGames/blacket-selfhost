import type { SubscriptionSeed } from "../types";

export const mvpSubscription: SubscriptionSeed = {
    stripeProductId: "fart2",
    name: "MVP",
    priority: 2,
    description:
        ":check: Everything in VIP\n" +
        ":check: Gradient Username Colors\n" +
        ":check: Custom Trading Table Color\n" +
        ":check: Custom Avatar\n" +
        ":check: Custom Banner\n" +
        ":check: Play Updates Early\n" +
        ":check: 100MB File Uploads\n" +
        ":check: 100 Auction Slots\n" +
        ":check: 3 Chat Badges",
    shortDescription:
        "Get a custom avatar, banner, trading table color, and more!",
    image: "{cdn}/content/badges/MVP.png",
    monthlyPriceId: "price_1SlS0VCFO8GPmE9Y7Debev9G",
    yearlyPriceId: "price_1T43d7CFO8GPmE9YZkpUyFOU",
    lifetimePrice: 99.99,
    tokenPrice: 150000,
    diamondPrice: 1500,
    crystalPrice: 150,
    color1: "#00FFFF",
    color2: "#0066FF",
    group: "MVP"
};

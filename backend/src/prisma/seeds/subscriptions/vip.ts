import type { SubscriptionSeed } from "../types";

export const vipSubscription: SubscriptionSeed = {
    stripeProductId: "fart",
    name: "VIP",
    priority: 1,
    description:
        ":check: Change your Username Color\n" +
        ":check: Use Colors in Chat\n" +
        ":check: 10MB File Uploads\n" +
        ":check: 25 Auction Slots\n" +
        ":check: 2 Chat Badges\n" +
        ":check: Less Auction Tax",
    shortDescription: "Change your username color, chat in color, and more!",
    image: "{cdn}/content/badges/VIP.png",
    monthlyPriceId: "price_1SlS0CCFO8GPmE9YP7djk9s9",
    yearlyPriceId: "price_1T43aSCFO8GPmE9Yg8hsXMqh",
    lifetimePrice: 29.99,
    color1: "#FFD000",
    color2: "#FFD000",
    group: "VIP"
};

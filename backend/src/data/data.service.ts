import { Injectable } from "@nestjs/common";
import { RedisService } from "src/redis/redis.service";
import { PrismaService } from "src/prisma/prisma.service";
import { StripeService } from "src/stripe/stripe.service";
import {
    ItemShop,
    Blook,
    DataBoostersEntity,
    PersonalBoost,
    StripeSubscriptionEntity
} from "@blacket/types";
import { BoostType, Subscription } from "@blacket/core";

export enum DataKey {
    BLOOK = "blook",
    RARITY = "rarity",
    PACK = "pack",
    ITEM = "item",
    ITEM_SHOP = "itemShop",
    TITLE = "title",
    BANNER = "banner",
    BADGE = "badge",
    FONT = "font",
    EMOJI = "emoji",
    RESOURCE = "resource",
    PRODUCT = "product",
    SUBSCRIPTION = "subscription",
    CREDIT = "credit",
    SPINNY_WHEEL = "spinnyWheel"
}

@Injectable()
export class DataService {
    constructor(private readonly redisService: RedisService,
        private readonly prismaService: PrismaService,
        private readonly stripeService: StripeService,) { }

    async getBlooksFromPack(packId: number): Promise<Blook[]> {
        const blooks = await this.redisService.getAllFromKey(DataKey.BLOOK);

        return blooks.filter((blook) =>
            blook.packId === packId &&
            (!blook.onlyOnDay ||
                blook.onlyOnDay === new Date().getDay() + 1),);
    }

    // comment for myself: gets active shop items
    async getActiveShopItems(): Promise<ItemShop[]> {
        const allShopItems = await this.redisService.getAllFromKey(DataKey.ITEM_SHOP);
        return allShopItems.filter((slot) =>
            slot.enabled === true);
    }

    async getBoosters(userId: string): Promise<DataBoostersEntity> {
        const globalBoosters = await this.prismaService.boost.findMany({
            where: {
                solo: false,
                createdAt: { lte: new Date() },
                expiresAt: { gte: new Date() }
            },
            orderBy: {
                expiresAt: "asc"
            },
            include: {
                user: true
            }
        });

        const globalChanceBoosters = globalBoosters.filter((b) => b.type === BoostType.CHANCE,);
        const globalShinyBoosters = globalBoosters.filter((b) => b.type === BoostType.SHINY,);

        const personalBoosters = await this.prismaService.boost.findMany({
            where: {
                solo: true,
                userId,
                createdAt: { lte: new Date() },
                expiresAt: { gte: new Date() }
            },
            orderBy: {
                expiresAt: "asc"
            }
        });

        const personalChanceBoosters = personalBoosters.filter((b) => b.type === BoostType.CHANCE,);
        const personalShinyBoosters = personalBoosters.filter((b) => b.type === BoostType.SHINY,);

        const activeGlobalChanceBooster = globalChanceBoosters[0];
        const activeGlobalShinyBooster = globalShinyBoosters[0];

        const activePersonalChanceBooster =
            personalChanceBoosters.slice(0, 5).reduce((acc: PersonalBoost, curr) => {
                if (!acc) return curr;
                return {
                    expiresAt: new Date(Math.max(acc.expiresAt.getTime(), curr.expiresAt.getTime())),
                    multiplier: parseFloat((
                        1 +
                        (acc.multiplier - 1) +
                        (curr.multiplier - 1)
                    ).toFixed(3))
                };
            }, null);
        const activePersonalShinyBooster = personalShinyBoosters
            .slice(0, 5)
            .reduce((acc: PersonalBoost, curr) => {
                if (!acc) return curr;
                return {
                    expiresAt: new Date(Math.max(acc.expiresAt.getTime(), curr.expiresAt.getTime())),
                    multiplier: parseFloat((
                        1 +
                        (acc.multiplier - 1) +
                        (curr.multiplier - 1)
                    ).toFixed(3))
                };
            }, null);

        return {
            global: {
                chance: activeGlobalChanceBooster ?? null,
                shiny: activeGlobalShinyBooster ?? null
            },
            personal: {
                chance: activePersonalChanceBooster ?? null,
                shiny: activePersonalShinyBooster ?? null
            }
        };
    }

    async getSubscriptions() {
        const subscriptions: Subscription[] =
            await this.redisService.getAllFromKey(DataKey.SUBSCRIPTION);

        return Promise.all(subscriptions.map(async (sub) => {
            delete sub.stripeProductId;

            const monthlyPrice = sub.monthlyPriceId ? await this.stripeService.getPrice(sub.monthlyPriceId) : null;

            const yearlyPrice = sub.yearlyPriceId ? await this.stripeService.getPrice(sub.yearlyPriceId) : null;

            delete sub.monthlyPriceId;
            delete sub.yearlyPriceId;

            return new StripeSubscriptionEntity({
                ...sub,
                monthlyPrice: monthlyPrice ? monthlyPrice.unit_amount / 100 : null,
                yearlyPrice: yearlyPrice ? yearlyPrice.unit_amount / 100 : null
            });
        }),);
    }
}

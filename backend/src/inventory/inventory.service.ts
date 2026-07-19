import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { BoostType, ItemType, Prisma } from "@blacket/core";
import {
    AuctionTypeEnum,
    BadRequest,
    InventoryRecentAveragePriceDto,
    InventoryRecentAveragePriceEntity,
    InventoryUseItemDto,
    NotFound,
    SocketMessageType
} from "@blacket/types";
import { DataService } from "src/data/data.service";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";
import { RewardsService } from "src/rewards/rewards.service";
import { SocketService } from "src/socket/socket.service";

const recentSaleLimit = 10;
const minValidSaleCount = 3;
const rapCacheTTLSeconds = 60;

const boosterEffects = {
    "1 Hour Booster": {
        global: true,
        types: [BoostType.CHANCE],
        notification: true
    },
    "Shiny Booster": {
        global: true,
        types: [BoostType.SHINY],
        notification: true
    },
    "Personal Shiny Booster": {
        global: false,
        types: [BoostType.SHINY],
        notification: false
    },
    "Personal Normal Booster": {
        global: false,
        types: [BoostType.CHANCE],
        notification: false
    }
} satisfies Record<string, {
    global: boolean;
    types: BoostType[];
    notification: boolean;
}>;

interface BoosterUserItem {
    id: number;
    itemId: number;
    usesLeft: number;
    createdAt: Date;
    item: {
        name: string;
        imageId: number;
        canUse: boolean;
        type: ItemType;
        boosterDuration: number | null;
        boosterMultiplier: number;
    };
    user: {
        username: string;
    };
}

interface RapItemData {
    fallbackRap: number | null;
    rarityName: string;
}

@Injectable()
export class InventoryService {
    constructor(private readonly prismaService: PrismaService,
        private readonly socketService: SocketService,
        private readonly dataService: DataService,
        private readonly redisService: RedisService,
        private readonly rewardsService: RewardsService) { }

    async getExistCount(type: string, id: number, shiny: boolean): Promise<number> {
        switch (type.toUpperCase()) {
            case "BLOOK":
                return await this.getBlookExistCount(id, shiny);
            case "ITEM":
                return await this.getItemExistCount(id);
            default:
                throw new BadRequestException(BadRequest.DEFAULT);
        }
    }

    // TODO: this needs to be overhauled
    async getRecentAveragePrice(dto: InventoryRecentAveragePriceDto): Promise<InventoryRecentAveragePriceEntity> {
        if (!dto || typeof dto !== "object" || Array.isArray(dto)) throw new BadRequestException(BadRequest.DEFAULT);
        if (dto.type !== AuctionTypeEnum.BLOOK && dto.type !== AuctionTypeEnum.ITEM) throw new BadRequestException(BadRequest.DEFAULT);
        if (dto.blookId !== undefined && (!Number.isInteger(dto.blookId) || dto.blookId < 1)) throw new BadRequestException(BadRequest.DEFAULT);
        if (dto.itemId !== undefined && (!Number.isInteger(dto.itemId) || dto.itemId < 1)) throw new BadRequestException(BadRequest.DEFAULT);
        if (dto.shiny !== undefined && typeof dto.shiny !== "boolean") throw new BadRequestException(BadRequest.DEFAULT);
        if (dto.type === AuctionTypeEnum.BLOOK && (!dto.blookId || dto.itemId !== undefined)) throw new BadRequestException(BadRequest.DEFAULT);
        if (dto.type === AuctionTypeEnum.ITEM && (!dto.itemId || dto.blookId !== undefined)) throw new BadRequestException(BadRequest.DEFAULT);

        const cacheKey = JSON.stringify({
            type: dto.type,
            blookId: dto.blookId ?? null,
            itemId: dto.itemId ?? null,
            shiny: dto.shiny ?? false
        });
        const cache = await this.redisService.getKey<InventoryRecentAveragePriceEntity>("recentAveragePrice", cacheKey);
        if (cache) return cache;

        const itemData = await this.getRapItemData(dto);
        const sales = await this.getRecentSales(dto);

        const rap = this.calculateRap(itemData.fallbackRap, itemData.rarityName, sales);

        await this.redisService.setKey("recentAveragePrice", cacheKey, rap, rapCacheTTLSeconds);

        return rap;
    }

    async getSpinnyWheelState() {
        const spinnyWheel = await this.getSpinnyWheelWithDrops(this.prismaService);

        if (!spinnyWheel) {
            throw new BadRequestException("There are no spinny wheel rewards available.");
        }

        const totalChance = spinnyWheel.rewards.reduce((total, reward) => total + reward.chance, 0);

        return {
            id: spinnyWheel.id,
            name: spinnyWheel.name,
            totalChance,
            drops: spinnyWheel.rewards.map((drop) => ({
                id: drop.id,
                rewardId: drop.rewardId,
                chance: drop.chance,
                odds: totalChance > 0 ? drop.chance / totalChance : 0,
                reward: drop.reward
            })),
            createdAt: spinnyWheel.createdAt,
            updatedAt: spinnyWheel.updatedAt
        };
    }

    private async getBlookExistCount(blookId: number, shiny: boolean): Promise<number> {
        const blook = await this.prismaService.blook.findUnique({
            where: { id: blookId },
            select: { id: true }
        });

        if (!blook) throw new NotFoundException(NotFound.UNKNOWN_BLOOK);

        return await this.prismaService.userBlook.count({
            where: {
                blookId,
                shiny,
                sold: false
            }
        });
    }

    private async getRapItemData(dto: InventoryRecentAveragePriceDto): Promise<RapItemData> {
        if (dto.blookId) {
            const blook = await this.prismaService.blook.findUnique({
                where: { id: dto.blookId },
                select: {
                    price: true,
                    rarity: {
                        select: { name: true }
                    }
                }
            });

            if (!blook) throw new NotFoundException(NotFound.UNKNOWN_BLOOK);

            return {
                fallbackRap: blook.price * (dto.shiny ? 10 : 1),
                rarityName: blook.rarity.name
            };
        }

        const item = await this.prismaService.item.findUnique({
            where: { id: dto.itemId },
            select: {
                rarity: {
                    select: { name: true }
                }
            }
        });

        if (!item) throw new NotFoundException(NotFound.UNKNOWN_ITEM);

        return {
            fallbackRap: null,
            rarityName: item.rarity.name
        };
    }

    private async getRecentSales(dto: InventoryRecentAveragePriceDto): Promise<number[]> {
        const auctions = await this.prismaService.auction.findMany({
            where: {
                type: dto.type,
                blook: dto.blookId ? {
                    blookId: dto.blookId,
                    shiny: dto.shiny ?? false
                } : undefined,
                item: dto.itemId ? { itemId: dto.itemId } : undefined,
                buyerId: { not: null },
                delistedAt: null
            },
            include: {
                bids: true
            },
            take: 25,
            orderBy: { updatedAt: "desc" }
        });

        return auctions
            .filter((auction) => auction.sellerId !== auction.buyerId)
            .map((auction) =>
                auction.buyItNow ? auction.price : Math.max(...auction.bids.map((bid) => bid.amount), 0),)
            .filter((price) => price > 0)
            .slice(0, recentSaleLimit)
            .reverse();
    }

    private calculateRap(fallbackRap: number | null,
        rarityName: string,
        salePrices: number[]): InventoryRecentAveragePriceEntity {
        if (salePrices.length === 0) {
            return {
                averagePrice: fallbackRap,
                lowestPrice: null,
                highestPrice: null,
                suspicious: false
            };
        }

        const oldRap = fallbackRap ?? this.getMedian(salePrices);
        let suspicious = false;

        const validSales = salePrices.filter((price) => {
            if (oldRap <= 0) return price > 0;

            const tooHigh = price > oldRap * 3;
            const tooLow = price < oldRap * 0.25;

            if (tooHigh || tooLow) suspicious = true;

            return !tooHigh && !tooLow;
        });

        const pricesForRange = validSales.length > 0 ? validSales : salePrices;
        const lowestPrice = Math.min(...pricesForRange);
        const highestPrice = Math.max(...pricesForRange);

        if (validSales.length < minValidSaleCount) {
            return {
                averagePrice: fallbackRap,
                lowestPrice,
                highestPrice,
                suspicious
            };
        }

        const weightedSaleAverage = this.getWeightedAverage(validSales);
        const smoothing = this.getRapSmoothing(rarityName);

        return {
            averagePrice: Math.round(oldRap * smoothing + weightedSaleAverage * (1 - smoothing)),
            lowestPrice,
            highestPrice,
            suspicious
        };
    }

    private getWeightedAverage(prices: number[]): number {
        const totalWeight = prices.reduce((sum, _, index) => sum + index + 1, 0);

        return prices.reduce((sum, price, index) => sum + price * (index + 1), 0) / totalWeight;
    }

    private getMedian(prices: number[]): number {
        const sortedPrices = [...prices].sort((a, b) => a - b);

        return sortedPrices[Math.floor(sortedPrices.length / 2)];
    }

    private getRapSmoothing(rarityName: string): number {
        switch (rarityName.toLowerCase()) {
            case "common":
            case "uncommon":
                return 0.6;
            case "legendary":
            case "chroma":
            case "mythical":
            case "iridescent":
                return 0.85;
            default:
                return 0.7;
        }
    }

    private async getItemExistCount(itemId: number): Promise<number> {
        const item = await this.prismaService.item.findUnique({
            where: { id: itemId },
            select: { id: true }
        });

        if (!item) throw new NotFoundException(NotFound.UNKNOWN_ITEM);

        return await this.prismaService.userItem.count({
            where: {
                itemId,
                usesLeft: { gt: 0 }
            }
        });
    }

    async useItem(userId: string, dto: InventoryUseItemDto) {
        const result = await this.prismaService.$transaction(async (tx) => {
            const userItem = await tx.userItem.findFirst({
                where: {
                    id: dto.userItemId,
                    userId,
                    usesLeft: { gt: 0 },
                    auctions: {
                        none: {
                            AND: [{ buyerId: null }, { delistedAt: null }]
                        }
                    }
                },
                include: {
                    item: true,
                    user: {
                        select: {
                            username: true
                        }
                    }
                }
            });

            if (!userItem) throw new NotFoundException(NotFound.UNKNOWN_ITEM);
            if (!userItem.item.canUse) throw new BadRequestException(BadRequest.DEFAULT);

            switch (userItem.item.type) {
                case ItemType.BOOSTER:
                    return await this.useBooster(tx, userId, userItem as unknown as BoosterUserItem);
                case ItemType.SPINNY_WHEEL_TICKET: {
                    const spinnyWheel = await this.getSpinnyWheelWithDrops(tx);

                    if (!spinnyWheel) {
                        throw new BadRequestException("There are no spinny wheel rewards available.");
                    }

                    const totalChance = spinnyWheel.rewards.reduce((total, reward) => total + reward.chance, 0);
                    if (totalChance <= 0) {
                        throw new BadRequestException("There are no spinny wheel rewards available.");
                    }

                    let roll = Math.random() * totalChance;
                    let prize = spinnyWheel.rewards[spinnyWheel.rewards.length - 1];

                    for (const reward of spinnyWheel.rewards) {
                        roll -= reward.chance;
                        if (roll <= 0) {
                            prize = reward;
                            break;
                        }
                    }

                    await tx.userItem.update({
                        where: { id: userItem.id },
                        data: { usesLeft: { decrement: 1 } }
                    });

                    const rewardResult = await this.rewardsService.giveRewardToUser(userId, prize.rewardId, undefined, undefined, tx);

                    return {
                        type: "SPINNY_WHEEL" as const,
                        item: {
                            id: userItem.id,
                            itemId: userItem.itemId,
                            imageId: userItem.item.imageId,
                            usesLeft: userItem.usesLeft - 1,
                            createdAt: userItem.createdAt,
                            updatedAt: new Date()
                        },
                        spinnyWheel: {
                            id: spinnyWheel.id,
                            name: spinnyWheel.name
                        },
                        prize,
                        reward: prize.reward,
                        rewardResult
                    };
                }
                default:
                    throw new BadRequestException(BadRequest.DEFAULT);
            }
        });

        if (result.type === "BOOSTER" && result.notification) {
            this.socketService.emitToAll(SocketMessageType.NOTIFICATION, {
                type: "BOOSTER",
                username: result.username,
                multiplier: result.multiplier,
                expiresAt: result.expiresAt,
                imageId: result.item.imageId
            });
        }

        if (result.type === "BOOSTER") {
            return {
                ...result,
                boosters: await this.dataService.getBoosters(userId)
            };
        }

        return result;
    }

    private async useBooster(tx: Prisma.TransactionClient,
        userId: string,
        userItem: BoosterUserItem) {
        const effect = boosterEffects[userItem.item.name];

        if (!effect) throw new BadRequestException(BadRequest.DEFAULT);

        const duration = userItem.item.boosterDuration ?? 0;
        if (duration <= 0) throw new BadRequestException(BadRequest.DEFAULT);

        const multiplier = userItem.item.boosterMultiplier;
        if (multiplier <= 1) throw new BadRequestException(BadRequest.DEFAULT);

        const now = new Date();

        if (effect.global) {
            const activeBooster = await tx.boost.findFirst({
                where: {
                    solo: false,
                    type: { in: effect.types },
                    createdAt: { lte: now },
                    expiresAt: { gte: now }
                }
            });

            if (activeBooster) {
                throw new BadRequestException("A matching global booster is already active.");
            }
        } else {
            const activeBooster = await tx.boost.findFirst({
                where: {
                    userId,
                    solo: true,
                    createdAt: { lte: now },
                    expiresAt: { gte: now }
                }
            });

            if (activeBooster) {
                throw new BadRequestException("A personal booster is already active.");
            }
        }

        const expiresAt = new Date(now.getTime() + duration * 1000);

        await tx.userItem.update({
            where: { id: userItem.id },
            data: { usesLeft: { decrement: 1 } }
        });

        await tx.boost.createMany({
            data: effect.types.map((type) => ({
                userId,
                multiplier,
                type,
                solo: !effect.global,
                expiresAt
            }))
        });

        return {
            type: "BOOSTER" as const,
            item: {
                id: userItem.id,
                itemId: userItem.itemId,
                imageId: userItem.item.imageId,
                usesLeft: userItem.usesLeft - 1,
                createdAt: userItem.createdAt,
                updatedAt: new Date()
            },
            username: userItem.user.username,
            multiplier,
            expiresAt,
            notification: effect.notification
        };
    }

    private async getSpinnyWheelWithDrops(tx: Prisma.TransactionClient | PrismaService) {
        const spinnyWheels = await tx.spinnyWheel.findMany({
            where: {
                rewards: {
                    some: {
                        chance: { gt: 0 }
                    }
                }
            },
            include: {
                rewards: {
                    where: {
                        chance: { gt: 0 }
                    },
                    include: {
                        reward: {
                            include: {
                                item: true,
                                blook: true,
                                title: true,
                                font: true,
                                banner: true
                            }
                        }
                    },
                    orderBy: [
                        { chance: "desc" },
                        { id: "asc" }
                    ]
                }
            },
            orderBy: [
                { name: "asc" },
                { id: "asc" }
            ]
        });
        const spinnyWheel =
            spinnyWheels.find((wheel) => wheel.name.toLowerCase().includes("daily")) ??
            spinnyWheels[0];

        return spinnyWheel ?? null;
    }
}

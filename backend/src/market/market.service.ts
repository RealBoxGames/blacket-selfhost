import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { MarketOpenPackDto, NotFound, Forbidden, openPack, MarketConvertDiamondsDto, InternalServerError } from "@blacket/types";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";
import { SocketService } from "src/socket/socket.service";
import { ChatService } from "src/chat/chat.service";
import { DataKey, DataService } from "src/data/data.service";
import { Blook, BlookObtainMethod, Boost, BoostType, ItemObtainMethod } from "@blacket/core";

@Injectable()
export class MarketService {
    constructor(private readonly prismaService: PrismaService,
        private readonly redisService: RedisService,
        private readonly socketService: SocketService,
        private readonly chatService: ChatService,
        private readonly dataService: DataService) { }

    // as opening packs is one of the MOST intensive operations we do
    // i'll be probably optimising this a few times and doing performance measures
    async openPack(userId: string, dto: MarketOpenPackDto) {
        const pack = await this.redisService.getPack(dto.packId);
        if (!pack || !pack.enabled) throw new NotFoundException(NotFound.UNKNOWN_PACK);

        return await this.prismaService.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ select: { tokens: true }, where: { id: userId } });
            if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);
            if (user.tokens < pack.price) throw new ForbiddenException(Forbidden.PACKS_NOT_ENOUGH_TOKENS);

            const packBlooks = await this.dataService.getBlooksFromPack(dto.packId);
            const rarities = await this.redisService.getAllFromKey(DataKey.RARITY);

            const boosters = await this.getActiveBoosters(userId);

            const blooks = await openPack(packBlooks, rarities, 1, boosters.chance, boosters.shiny)
                .catch((err) => {
                    if (err.message === NotFound.UNKNOWN_PACK) throw new NotFoundException(NotFound.UNKNOWN_PACK);
                    else throw new InternalServerErrorException(InternalServerError.DEFAULT);
                });
            if (!blooks) throw new NotFoundException(NotFound.UNKNOWN_PACK);

            // increment user's pack opened amount, and experience. insert blook to table. decrement user tokens
            await tx.user.update({ select: null, where: { id: userId }, data: { tokens: { decrement: pack.price } } });
            await tx.userStatistic.update({ select: null, where: { id: userId }, data: { packsOpened: { increment: 1 } } });

            const blookId = blooks[0].blookId;
            const shiny = blooks[0].shiny > 0;

            // const currentCount = await tx.userBlook.count({ where: { blookId, shiny } });
            // TODO: figure out a way to make this faster
            const currentCount = await tx.userBlook.findFirst({ where: { blookId, shiny }, orderBy: { serial: "desc" }, select: { serial: true } })
                .then((res) => res?.serial ?? 0);
            const nextSerial = currentCount + 1;

            const blook = packBlooks.find((blook) => blook.id === blookId);
            if (blook?.video) {
                this.spamChatOnInsanePull(userId, blook);

                this.socketService.emitInsanePullEvent({
                    userId,
                    videoId: blook.video.resourceId
                });
            }

            return await tx.userBlook.create({ select: null, data: { userId, initialObtainerId: userId, blookId, shiny, obtainedBy: BlookObtainMethod.PACK_OPEN, serial: nextSerial } });
        });
    }

    async buyFromItemShop(userId: string, dto: { id: number }) {
        const itemShopPurchase = await this.redisService.getItemShopItem(dto.id);

        if (!itemShopPurchase || !itemShopPurchase.enabled) throw new NotFoundException(NotFound.DEFAULT);

        return await this.prismaService.$transaction(async (tx) => {
            const user = await tx.user.findUnique({select: {tokens: true}, where: {id: userId}}); // presumably gets user
            if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);
            if (user.tokens < itemShopPurchase.price) throw new ForbiddenException(Forbidden.PACKS_NOT_ENOUGH_TOKENS); // ur broke

            if (!itemShopPurchase.blookId && !itemShopPurchase.itemId) throw new ForbiddenException(Forbidden.DEFAULT);
            if (itemShopPurchase.blookId && itemShopPurchase.itemId) throw new ForbiddenException(Forbidden.DEFAULT); // this is so that they dont overlap.

            // removes le User Coins...

            await tx.user.update({
                select: null,
                where: {id: userId},
                data: {tokens: {decrement: itemShopPurchase.price}}
            });

            if (itemShopPurchase.blookId) {
                const blookId = itemShopPurchase.blookId;
                const shiny = false;
                // changes serial
                const currentCount = await tx.userBlook.findFirst({
                    where: {blookId, shiny},
                    orderBy: {serial: "desc"},
                    select: {serial: true}

                }).then((res) => res?.serial ?? 0);
                const nextSerial = currentCount + 1;

                return await tx.userBlook.create({
                    select: null,
                    data: {
                        userId,
                        initialObtainerId: userId,
                        blookId,
                        shiny,
                        obtainedBy: BlookObtainMethod.REWARD, // TODO: consider adding a specified ITEM_SHOP version for BlookObtainMethod (post-rewrite perhaps)
                        serial: nextSerial
                    }
                });
            }

            if (itemShopPurchase.itemId) {
                const itemId = itemShopPurchase.itemId;

                return await tx.userItem.create({
                    select: null,
                    data: {
                        userId,
                        initialObtainerId: userId,
                        itemId,
                        obtainedBy: ItemObtainMethod.ITEM_SHOP
                    }
                });
            }
        });
    }

    async convertDiamonds(userId: string, dto: MarketConvertDiamondsDto) {
        return await this.prismaService.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { diamonds: true }
            });
            if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

            if (user.diamonds < dto.amount) throw new ForbiddenException(Forbidden.DEFAULT_NOT_ENOUGH_DIAMONDS,);

            await tx.user.update({
                where: { id: userId },
                data: {
                    diamonds: { decrement: dto.amount },
                    tokens: { increment: dto.amount * 3 }
                }
            });
        });
    }

    private async getActiveBoosters(userId: string) {
        const now = new Date();

        const boosts = await this.prismaService.boost.findMany({
            where: {
                OR: [
                    { solo: false },
                    { solo: true, userId }
                ],
                createdAt: { lte: now },
                expiresAt: { gte: now }
            },
            orderBy: {
                expiresAt: "asc"
            }
        });

        const chance = this.combineBoosts(boosts.filter((boost) => boost.type === BoostType.CHANCE));
        const shiny = this.combineBoosts(boosts.filter((boost) => boost.type === BoostType.SHINY));

        return { chance, shiny };
    }

    private combineBoosts(boosts: Boost[]) {
        return boosts.slice(0, 5).reduce((multiplier, boost) => {
            return parseFloat((multiplier + boost.multiplier - 1).toFixed(3));
        }, 1);
    }

    // TODO: system messages
    private async spamChatOnInsanePull(userId: string, blook: Blook) {
        this.chatService.createMessage(userId, 0, {
            content: `I JUST PULLED A ${blook.name.toUpperCase()}!!!\n`.repeat(50),
            nonce: crypto.randomUUID()
        });
    }
}

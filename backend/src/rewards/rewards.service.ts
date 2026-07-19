import {
    BlookObtainMethod,
    Prisma,
    RewardType,
    UserBanner,
    UserFont,
    UserTitle
} from "@blacket/core";
import { NotFound } from "@blacket/types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";

type GiveRewardResult =
    | Prisma.BatchPayload
    | { tokens: number }
    | { diamonds: number }
    | { crystals: number }
    | UserTitle
    | UserBanner
    | UserFont;

@Injectable()
export class RewardsService {
    constructor(private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,) {}

    async getRewardById(rewardId: number) {
        return this.prismaService.reward.findUnique({
            where: {
                id: rewardId
            }
        });
    }

    async giveRewardToUser(userId: string,
        rewardId: number,
        quantityOverride?: number,
        multiplyOriginalQuantity?: boolean,
        tx: Prisma.TransactionClient = this.prismaService,): Promise<GiveRewardResult> {
        const reward = await this.getRewardById(rewardId);
        if (!reward) throw new NotFoundException(NotFound.UNKNOWN_REWARD);

        const QUANTITY =
            quantityOverride !== undefined? multiplyOriginalQuantity? reward.quantity * quantityOverride: quantityOverride: reward.quantity;

        let result: GiveRewardResult;

        switch (reward.type) {
            // items
            case RewardType.BLOOK:
                const blooks = [];

                const [normalSerial, shinySerial] = await Promise.all([
                    tx.userBlook
                        .findFirst({
                            where: {
                                blookId: reward.blookId,
                                shiny: false
                            },
                            orderBy: {
                                serial: "desc"
                            }
                        })
                        .then((b) => (b ? b.serial : 0)),
                    tx.userBlook
                        .findFirst({
                            where: {
                                blookId: reward.blookId,
                                shiny: true
                            },
                            orderBy: {
                                serial: "desc"
                            }
                        })
                        .then((b) => (b ? b.serial : 0))
                ]);

                for (let i = 0; i < QUANTITY; i++) {
                    const shiny =
                        Math.random() <
                        this.configService.get<number>("VITE_BASE_SHINY_CHANCE",) /
                            100;

                    blooks.push({
                        userId,
                        blookId: reward.blookId,
                        shiny,
                        serial: shiny? shinySerial + i + 1: normalSerial + i + 1,
                        initialObtainerId: userId,
                        obtainedBy: BlookObtainMethod.REWARD
                    });
                }

                result = await tx.userBlook.createMany({ data: blooks });

                break;
            case RewardType.ITEM:
                result = await tx.userItem.createMany({
                    data: Array.from({ length: QUANTITY }).map(() => ({
                        userId,
                        itemId: reward.itemId,
                        initialObtainerId: userId,
                        obtainedBy: BlookObtainMethod.REWARD
                    }))
                });
                break;

            // currencies
            case RewardType.TOKENS:
            case RewardType.DIAMONDS:
            case RewardType.CRYSTALS:
                let field: "tokens" | "diamonds" | "crystals";

                if (reward.type === RewardType.TOKENS) field = "tokens";
                else if (reward.type === RewardType.DIAMONDS) field = "diamonds";
                else field = "crystals";

                const updateResult = await tx.user.update({
                    where: { id: userId },
                    data: {
                        [field]: {
                            increment: QUANTITY
                        }
                    }
                });

                result = { [field]: updateResult[field] } as GiveRewardResult;

                break;

            // other (titles, banners)
            // these do not have quantity
            case RewardType.TITLE:
                result = await tx.userTitle.create({
                    data: {
                        userId,
                        titleId: reward.titleId
                    }
                });
                break;
            case RewardType.BANNER:
                result = await tx.userBanner.create({
                    data: {
                        userId,
                        bannerId: reward.bannerId
                    }
                });
                break;
            case RewardType.FONT:
                result = await tx.userFont.create({
                    data: {
                        userId,
                        fontId: reward.fontId
                    }
                });
                break;

            default:
                throw new NotFoundException(NotFound.UNKNOWN_REWARD);
        }

        return result;
    }

    async giveRewardsToUser(userId: string,
        rewardIds: number[],
        quantityOverride?: number,
        multiplyOriginalQuantity?: boolean,
        tx: Prisma.TransactionClient = this.prismaService,): Promise<GiveRewardResult[]> {
        return Promise.all(rewardIds.map((rewardId) =>
                this.giveRewardToUser(userId, rewardId, quantityOverride, multiplyOriginalQuantity, tx,),),);
    }
}

import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { TokenDistribution, Forbidden } from "@blacket/types";

@Injectable()
export class QuestsService {
    private dailyTokensDistribution: TokenDistribution[] = [
        { chance: 17, amount: 1000 },
        { chance: 16, amount: 1250 },
        { chance: 15, amount: 1500 },
        { chance: 14, amount: 1750 },
        { chance: 13, amount: 2000 },
        { chance: 12, amount: 2250 },
        { chance: 11, amount: 2500 },
        { chance: 10, amount: 2750 },
        { chance: 9, amount: 3000 },
        { chance: 8, amount: 3250 },
        { chance: 7, amount: 3500 },
        { chance: 6, amount: 3750 },
        { chance: 5, amount: 4000 },
        { chance: 4, amount: 4250 },
        { chance: 3, amount: 4500 },
        { chance: 2, amount: 4750 },
        { chance: 1, amount: 5000 }
    ];
    private dailyTokensDistributionTotalChance =
        this.dailyTokensDistribution.reduce((acc, curr) => acc + curr.chance, 0,);

    constructor(private readonly prismaService: PrismaService) {}

    private getRandomDailyTokens(): number {
        // math.random is inclusive 0 and exclusive 1
        const rand: number =
            Math.floor(Math.random() * this.dailyTokensDistributionTotalChance,) + 1;

        let cumulativeChance: number = 0;
        for (const distribution of this.dailyTokensDistribution) {
            cumulativeChance += distribution.chance;

            if (rand <= cumulativeChance) return distribution.amount;
        }

        // this should never be reached, but just incase...
        return this.dailyTokensDistribution[0].amount;
    }

    async claimDailyTokens(userId: string): Promise<{ tokens: number }> {
        const claimableDate = new Date();
        claimableDate.setUTCHours(0, 0, 0, 0);

        const tokensToAdd = this.getRandomDailyTokens();

        // single conditional UPDATE (not read-then-write) so two concurrent
        // claim requests can't both pass a stale lastClaimed check and both
        // credit tokens - only the first to commit can match the WHERE
        const claimed = await this.prismaService.user.updateMany({
            where: {
                id: userId,
                OR: [
                    { lastClaimed: null },
                    { lastClaimed: { lt: claimableDate } }
                ]
            },
            data: {
                tokens: {
                    increment: tokensToAdd
                },
                lastClaimed: claimableDate
            }
        });
        if (claimed.count === 0) throw new ForbiddenException(Forbidden.QUESTS_DAILY_ALREADY_CLAIMED,);

        return { tokens: tokensToAdd };
    }
}

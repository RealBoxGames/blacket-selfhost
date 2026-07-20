import { Controller, Post } from "@nestjs/common";
import { QuestsService } from "./quests.service";
import { ApiTags } from "@nestjs/swagger";
import { GetCurrentUser } from "src/core/decorator";

@ApiTags("quests")
@Controller("quests")
export class QuestsController {
    constructor(private readonly questsService: QuestsService) { }

    @Post("daily")
    async claimDaily(@GetCurrentUser() userId: string) {
        return await this.questsService.claimDailyTokens(userId);
    }
}

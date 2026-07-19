import { Controller } from "@nestjs/common";
import { QuestsService } from "./quests.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("quests")
@Controller("quests")
export class QuestsController {
    constructor(private readonly questsService: QuestsService) { }

    // TODO: implement
}

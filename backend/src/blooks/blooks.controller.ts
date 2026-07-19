import { Body, Controller, HttpCode, HttpStatus, Put } from "@nestjs/common";
import { BlooksService } from "./blooks.service";
import { GetCurrentUser } from "src/core/decorator";
import { ApiTags } from "@nestjs/swagger";
import { BlooksSellBlookDto } from "@blacket/types";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("blooks")
@Controller("blooks")
export class BlooksController {
    constructor(private readonly blooksService: BlooksService) {}

    @Put("sell-blooks")
    @HttpCode(HttpStatus.NO_CONTENT)
    async sellBlooks(@GetCurrentUser() userId: string,
        @Body() dto: BlooksSellBlookDto,) {
        return await this.blooksService.sellBlooks(userId, dto);
    }
}

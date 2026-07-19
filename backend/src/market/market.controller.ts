import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Put
} from "@nestjs/common";
import { MarketService } from "./market.service";
import { GetCurrentUser } from "src/core/decorator";
import { ApiTags } from "@nestjs/swagger";
import { MarketConvertDiamondsDto, MarketOpenPackDto } from "@blacket/types";
import { seconds, Throttle } from "@nestjs/throttler";

@ApiTags("market")
@Controller("market")
export class MarketController {
    constructor(private readonly marketService: MarketService) {}

    @Throttle({ global: { limit: 1, ttl: seconds(0.7) } })
    @Post("open-pack")
    async openPack(@GetCurrentUser() userId: string,
        @Body() dto: MarketOpenPackDto,) {
        return await this.marketService.openPack(userId, dto);
    }

    @Throttle({ global: { limit: 1, ttl: seconds(10) } })
    @Put("convert-diamonds")
    @HttpCode(HttpStatus.NO_CONTENT)
    async convertDiamonds(@GetCurrentUser() userId: string,
        @Body() dto: MarketConvertDiamondsDto,) {
        return await this.marketService.convertDiamonds(userId, dto);
    }
}

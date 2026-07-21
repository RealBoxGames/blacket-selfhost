import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
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

    @Throttle({ global: { limit: 3, ttl: seconds(2) } })
    @Post("item-shop/:id")
    async buyFromItemShop(@GetCurrentUser() userId: string,
        @Param("id", ParseIntPipe) id: number,) {
        return await this.marketService.buyFromItemShop(userId, { id });
    }

    @Throttle({ global: { limit: 1, ttl: seconds(10) } })
    @Put("convert-diamonds")
    @HttpCode(HttpStatus.NO_CONTENT)
    async convertDiamonds(@GetCurrentUser() userId: string,
        @Body() dto: MarketConvertDiamondsDto,) {
        return await this.marketService.convertDiamonds(userId, dto);
    }

    @Throttle({ global: { limit: 1, ttl: seconds(10) } })
    @Put("convert-diamonds-to-crystals")
    async convertDiamondsToCrystals(@GetCurrentUser() userId: string,
        @Body() dto: MarketConvertDiamondsDto,) {
        return await this.marketService.convertDiamondsToCrystals(userId, dto);
    }
}

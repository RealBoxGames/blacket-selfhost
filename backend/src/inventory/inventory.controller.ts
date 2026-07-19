import { Body, Controller, Get, Param, ParseBoolPipe, ParseIntPipe, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { seconds, Throttle } from "@nestjs/throttler";
import {
    InventoryExistCountEntity,
    InventoryRecentAveragePriceDto,
    InventoryRecentAveragePriceEntity,
    InventoryUseItemDto
} from "@blacket/types";
import { CoreService } from "src/core/core.service";
import { GetCurrentUser } from "src/core/decorator";
import { InventoryService } from "./inventory.service";

@ApiTags("inventory")
@Controller("inventory")
export class InventoryController {
    constructor(private readonly coreService: CoreService,
        private readonly inventoryService: InventoryService) { }

    @Get("exist-count/:type/:id/:shiny")
    async getExistCount(@Param("type") type: string,
        @Param("id", ParseIntPipe) id: number,
        @Param("shiny", ParseBoolPipe) shiny: boolean,) {
        const count = await this.inventoryService.getExistCount(type, id, shiny);

        return new InventoryExistCountEntity({ count });
    }

    @Get("recent-average-price/:filters")
    async getRecentAveragePrice(@Param("filters") dto: InventoryRecentAveragePriceDto) {
        const recentAveragePrice = await this.inventoryService.getRecentAveragePrice(this.coreService.safelyParseJSON(dto as string));

        return new InventoryRecentAveragePriceEntity(recentAveragePrice);
    }

    @Get("spinny-wheel/state")
    async getSpinnyWheelState() {
        return await this.inventoryService.getSpinnyWheelState();
    }

    @Throttle({ global: { limit: 1, ttl: seconds(1) } })
    @Post("use-item")
    async useItem(@GetCurrentUser() userId: string,
        @Body() dto: InventoryUseItemDto,) {
        return await this.inventoryService.useItem(userId, dto);
    }
}

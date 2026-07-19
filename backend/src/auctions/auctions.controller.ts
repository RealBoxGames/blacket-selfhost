import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CoreService } from "src/core/core.service";
import { AuctionsService } from "./auctions.service";
import { GetCurrentUser, RealIp } from "src/core/decorator";
import {
    AuctionsAuctionEntity,
    AuctionsBidAuctionDto,
    AuctionsBuyAuctionDto,
    AuctionsCreateAuctionDto,
    AuctionsSearchAuctionDto
} from "@blacket/types";

@ApiTags("auctions")
@Controller("auctions")
export class AuctionsController {
    constructor(private coreService: CoreService,
        private auctionsService: AuctionsService,) {}

    @Get(":filters")
    async getAuctions(@Param("filters") dto: AuctionsSearchAuctionDto | string,) {
        const auctions = await this.auctionsService.getAuctions(this.coreService.safelyParseJSON(dto as string),);

        return auctions.map((auction) => new AuctionsAuctionEntity(auction));
    }

    @Post("")
    async createAuction(@GetCurrentUser() userId: string,
        @Body() dto: AuctionsCreateAuctionDto,) {
        return await this.auctionsService.createAuction(userId, dto);
    }

    @Put(":id/bin")
    @HttpCode(HttpStatus.NO_CONTENT)
    async buyItNow(@GetCurrentUser() userId: string,
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: AuctionsBuyAuctionDto,
        @RealIp() ip: string,) {
        return await this.auctionsService.buyItNow(userId, id, dto, ip);
    }

    @Post(":id/bid")
    async bid(@GetCurrentUser() userId: string,
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: AuctionsBidAuctionDto,
        @RealIp() ip: string,) {
        return await this.auctionsService.bid(userId, id, dto, ip);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeAuction(@GetCurrentUser() userId: string,
        @Param("id", ParseIntPipe) id: number,) {
        return await this.auctionsService.removeAuction(userId, id);
    }
}

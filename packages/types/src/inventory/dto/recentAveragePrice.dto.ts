import { IsBoolean, IsEnum, IsNumber, IsOptional } from "class-validator";
import { AuctionTypeEnum } from "../../interfaces";

export class InventoryRecentAveragePriceDto {
    @IsEnum(AuctionTypeEnum)
    readonly type?: AuctionTypeEnum;

    @IsOptional()
    @IsNumber()
    readonly blookId?: number;

    @IsOptional()
    @IsNumber()
    readonly itemId?: number;

    @IsOptional()
    @IsBoolean()
    readonly shiny?: boolean;
}

export default InventoryRecentAveragePriceDto;

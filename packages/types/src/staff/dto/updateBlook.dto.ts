import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import type { DayType } from "../../interfaces";

export class StaffAdminUpdateBlookDto {
    @IsOptional()
    @IsString()
    readonly name?: string;

    @IsOptional()
    @IsString()
    readonly description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    readonly chance?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    readonly price?: number;

    @IsOptional()
    @IsInt()
    readonly rarityId?: number;

    @IsOptional()
    @IsInt()
    readonly imageId?: number;

    @IsOptional()
    @IsInt()
    readonly backgroundId?: number;

    @IsOptional()
    @IsInt()
    readonly packId?: number | null;

    @IsOptional()
    readonly onlyOnDay?: DayType | null;

    @IsOptional()
    @IsBoolean()
    readonly isBig?: boolean;

    @IsOptional()
    @IsBoolean()
    readonly canSell?: boolean;

    @IsOptional()
    @IsBoolean()
    readonly canTrade?: boolean;

    @IsOptional()
    @IsBoolean()
    readonly canAuction?: boolean;

    @IsOptional()
    @IsInt()
    readonly shinyHue?: number;

    @IsOptional()
    @IsInt()
    readonly priority?: number;
}

export default StaffAdminUpdateBlookDto;

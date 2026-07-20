import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { DayTypeEnum } from "../../interfaces";

export class StaffAdminCreateBlookDto {
    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @IsOptional()
    @IsString()
    readonly description?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    readonly chance: number;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    readonly price: number;

    @IsNotEmpty()
    @IsInt()
    readonly rarityId: number;

    @IsNotEmpty()
    @IsInt()
    readonly imageId: number;

    @IsNotEmpty()
    @IsInt()
    readonly backgroundId: number;

    @IsOptional()
    @IsInt()
    readonly packId?: number;

    @IsOptional()
    readonly onlyOnDay?: DayTypeEnum;

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

export default StaffAdminCreateBlookDto;

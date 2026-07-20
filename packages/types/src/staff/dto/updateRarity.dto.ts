import { IsBoolean, IsInt, IsOptional, Length, Matches, Min } from "class-validator";
import type { RarityAnimationType } from "../../interfaces";

export class StaffAdminUpdateRarityDto {
    @IsOptional()
    @Length(1)
    readonly name?: string;

    @IsOptional()
    @Length(7, 7)
    @Matches(/^#[0-9a-fA-F]{6}$/)
    readonly color?: string;

    @IsOptional()
    readonly animationType?: RarityAnimationType;

    @IsOptional()
    @IsInt()
    @Min(0)
    readonly experience?: number;

    @IsOptional()
    @IsBoolean()
    readonly affectedByBooster?: boolean;

    @IsOptional()
    @IsInt()
    readonly imageId?: number | null;

    @IsOptional()
    @IsInt()
    readonly priority?: number;
}

export default StaffAdminUpdateRarityDto;

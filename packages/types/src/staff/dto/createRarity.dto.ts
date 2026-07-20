import { IsBoolean, IsInt, IsNotEmpty, IsOptional, Length, Matches, Min } from "class-validator";
import type { RarityAnimationType } from "../../interfaces";

export class StaffAdminCreateRarityDto {
    @IsNotEmpty()
    @Length(1)
    readonly name: string;

    @IsNotEmpty()
    @Length(7, 7)
    @Matches(/^#[0-9a-fA-F]{6}$/)
    readonly color: string;

    @IsNotEmpty()
    readonly animationType: RarityAnimationType;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    readonly experience: number;

    @IsOptional()
    @IsBoolean()
    readonly affectedByBooster?: boolean;

    @IsOptional()
    @IsInt()
    readonly imageId?: number;

    @IsOptional()
    @IsInt()
    readonly priority?: number;
}

export default StaffAdminCreateRarityDto;

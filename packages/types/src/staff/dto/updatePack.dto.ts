import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class StaffAdminUpdatePackDto {
    @IsOptional()
    @IsString()
    readonly name?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    readonly price?: number;

    @IsOptional()
    @IsInt()
    readonly imageId?: number;

    @IsOptional()
    @IsInt()
    readonly iconId?: number;

    @IsOptional()
    @IsInt()
    readonly backgroundId?: number;

    @IsOptional()
    @IsInt()
    readonly ambienceId?: number | null;

    @IsOptional()
    @IsBoolean()
    readonly enabled?: boolean;

    @IsOptional()
    @IsBoolean()
    readonly hidden?: boolean;

    @IsOptional()
    @IsInt()
    readonly priority?: number;
}

export default StaffAdminUpdatePackDto;

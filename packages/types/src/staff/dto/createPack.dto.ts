import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class StaffAdminCreatePackDto {
    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    readonly price: number;

    @IsNotEmpty()
    @IsInt()
    readonly imageId: number;

    @IsNotEmpty()
    @IsInt()
    readonly iconId: number;

    @IsNotEmpty()
    @IsInt()
    readonly backgroundId: number;

    @IsOptional()
    @IsInt()
    readonly ambienceId?: number;

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

export default StaffAdminCreatePackDto;

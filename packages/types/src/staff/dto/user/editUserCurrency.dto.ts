import { IsInt, IsOptional, Min } from "class-validator";

export class StaffAdminEditUserCurrencyDto {
    @IsOptional()
    @IsInt()
    @Min(0)
    readonly tokens?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    readonly diamonds?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    readonly crystals?: number;
}

export default StaffAdminEditUserCurrencyDto;

import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class StaffAdminGiveTokensDto {
    @IsNotEmpty()
    @IsString()
    readonly username: string;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    readonly tokens: number;
}

export default StaffAdminGiveTokensDto;

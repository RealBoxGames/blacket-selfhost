import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class StaffAdminGiveUserBlookDto {
    @IsNotEmpty()
    @IsInt()
    readonly blookId: number;

    @IsOptional()
    @IsBoolean()
    readonly shiny?: boolean;
}

export default StaffAdminGiveUserBlookDto;

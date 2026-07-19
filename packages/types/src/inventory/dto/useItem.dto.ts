import { IsNotEmpty, IsNumber } from "class-validator";

export class InventoryUseItemDto {
    @IsNotEmpty()
    @IsNumber()
    readonly userItemId: number;
}

export default InventoryUseItemDto;
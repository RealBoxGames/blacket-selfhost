// le epic dto dattebayo
// - vienna
import { IsNotEmpty, IsNumber } from "class-validator";

export class MarketUseBoosterDto {
    @IsNotEmpty()
    @IsNumber()
    readonly userItemId: number;
}

export default MarketUseBoosterDto;
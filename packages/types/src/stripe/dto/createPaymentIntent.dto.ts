import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Validate } from "class-validator";
import { BillingIntervalEnum } from "../../interfaces";

export class StripeCreatePaymentIntentDto {
    @IsOptional()
    @IsNumber()
    @Validate((value: number) => value > 0 && value <= 100)
    readonly quantity?: number;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    readonly paymentMethodId?: string;

    @IsOptional()
    @IsEnum(BillingIntervalEnum)
    readonly interval?: BillingIntervalEnum;
}

export default StripeCreatePaymentIntentDto;

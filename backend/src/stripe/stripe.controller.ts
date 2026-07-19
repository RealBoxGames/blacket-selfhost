import {
    BadRequestException,
    Body,
    Controller,
    Headers,
    Param,
    Post,
    Get,
    Request,
    ParseIntPipe
} from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { GetCurrentUser, Public, RealIp } from "src/core/decorator";
// import { hours, minutes, seconds, Throttle } from "@nestjs/throttler";
import {
    StripeCreatePaymentIntentDto,
    StripeStoreEntity
} from "@blacket/types";

@Controller("stripe")
export class StripeController {
    constructor(private stripeService: StripeService) {}

    @Public()
    @Post("webhook")
    async webhook(@Headers("stripe-signature") signature: string,
        @Request() request: any,) {
        if (!signature) throw new BadRequestException();

        const body = request.body;
        if (!body) throw new BadRequestException();

        const event = await this.stripeService.constructWebhookEvent(body, signature,);
        if (!event) throw new BadRequestException();

        return this.stripeService.handleWebhook(event);
    }

    // @Throttle({ global: { limit: 1, ttl: seconds(10) } })
    @Get("stores")
    async getStores(): Promise<StripeStoreEntity[]> {
        return await this.stripeService
            .getStores()
            .then((stores) =>
                stores.map((store) => new StripeStoreEntity(store)),);
    }

    // @Throttle({ global: { limit: 3, ttl: seconds(10) } })
    @Post("portal")
    async createPortal(@GetCurrentUser() userId: string) {
        return this.stripeService.createPortal(userId);
    }

    // @Throttle({ global: { limit: 100, ttl: hours(1) } })
    // @Post("setup-intent")
    // async createSetupIntent(
    //     @GetCurrentUser() userId: string,
    // ) {
    //     const setupIntent = await this.stripeService.createSetupIntent(userId);

    //     return new StripeCreateSetupIntentEntity(setupIntent);
    // }

    // @Throttle({ global: { limit: 5, ttl: hours(1) } })
    // @Post("payment-methods")
    // async createPaymentMethod(
    //     @GetCurrentUser() userId: string,
    //     @Body() dto: StripeCreatePaymentMethodDto
    // ) {
    //     const paymentMethod = (await this.stripeService.createPaymentMethod(userId, dto));

    //     return new StripeCreatePaymentMethodEntity(paymentMethod);
    // }

    // @Throttle({ global: { limit: 10, ttl: hours(1) } })
    // @Put("payment-methods/:id")
    // @HttpCode(HttpStatus.NO_CONTENT)
    // selectPaymentMethod(
    //     @GetCurrentUser() userId: string,
    //     @Param("id") id: string
    // ) {
    //     return this.stripeService.selectPaymentMethod(userId, parseInt(id));
    // }

    // @Throttle({ global: { limit: 10, ttl: hours(1) } })
    // @Delete("payment-methods/:id")
    // @HttpCode(HttpStatus.NO_CONTENT)
    // removePaymentMethod(
    //     @GetCurrentUser() userId: string,
    //     @Param("id") id: string
    // ) {
    //     return this.stripeService.removePaymentMethod(userId, parseInt(id));
    // }

    // @Throttle({ global: { limit: 3, ttl: hours(1) } })
    @Post("payment-intent/:productId")
    async createPaymentIntent(@GetCurrentUser() userId: string,
        @Param("productId", ParseIntPipe) id: number,
        @Body() dto: StripeCreatePaymentIntentDto,
        @RealIp() ip: string,) {
        return this.stripeService.createPaymentIntent(userId, id, dto, ip);
    }

    // @Throttle({ global: { limit: 3, ttl: hours(1) } })
    @Post("plan-switch/:productId")
    async switchPlan(@GetCurrentUser() userId: string,
        @Param("productId", ParseIntPipe) id: number,
        @Body() dto: StripeCreatePaymentIntentDto,
        @RealIp() ip: string,) {
        return this.stripeService.switchPlan(userId, id, dto, ip);
    }

    // @Throttle({ global: { limit: 3, ttl: hours(1) } })
    @Post("subscription/:subscriptionId")
    async createSubscription(@GetCurrentUser() userId: string,
        @Param("subscriptionId", ParseIntPipe) id: number,
        @Body() dto: StripeCreatePaymentIntentDto,
        @RealIp() ip: string,) {
        return this.stripeService.createSubscription(userId, id, dto, ip);
    }

    // @Throttle({ global: { limit: 3, ttl: hours(1) } })
    @Post("cancel-subscription/:subscriptionId")
    async cancelSubscription(@GetCurrentUser() userId: string,
        @Param("subscriptionId", ParseIntPipe) subscriptionId: number,) {
        return this.stripeService.deleteSubscription(userId, subscriptionId);
    }

    // @Throttle({ global: { limit: 3, ttl: minutes(1) } })
    @Post("purchase-with-crystals/:productId")
    async purchaseWithCrystals(@GetCurrentUser() userId: string,
        @Param("productId", ParseIntPipe) id: number,
        @Body() dto: StripeCreatePaymentIntentDto,
        @RealIp() ip: string,) {
        return this.stripeService.purchaseWithCrystals(userId, id, dto.quantity, ip,);
    }

    // @Throttle({ global: { limit: 4, ttl: hours(1) } })
    // @Post("invoice/:productId")
    // async createInvoice(
    //     @GetCurrentUser() userId: string,
    //     @Param("productId") id: string,
    //     @RealIp() ip: string
    // ) {
    //     return this.stripeService.createSubscription(userId, parseInt(id), ip);
    // }
}

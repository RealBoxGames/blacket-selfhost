import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StripeService } from "./stripe.service";
import { StripeController } from "./stripe.controller";
import { RewardsModule } from "src/rewards/rewards.module";
import { UsersModule } from "src/users/users.module";

@Global()
@Module({
    controllers: [StripeController],
    providers: [StripeService],
    exports: [StripeService],
    imports: [ConfigModule, RewardsModule, UsersModule]
})
export class StripeModule {
    static forRoot() {
        return {
            module: StripeModule,
            providers: [
                {
                    provide: "STRIPE_OPTIONS",
                    useFactory: () => ({
                        apiKey: process.env.SERVER_STRIPE_SECRET_KEY,
                        options: {}
                    })
                }
            ],
            exports: [StripeService]
        };
    }
}

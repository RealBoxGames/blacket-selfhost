import { Module } from "@nestjs/common";
import { MarketService } from "./market.service";
import { MarketController } from "./market.controller";
import { DataModule } from "src/data/data.module";
import { ChatService } from "src/chat/chat.service";

@Module({
    imports: [DataModule],
    controllers: [MarketController],
    providers: [MarketService, ChatService]
})
export class MarketModule {}

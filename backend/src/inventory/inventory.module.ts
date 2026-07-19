import { Module } from "@nestjs/common";
import { DataModule } from "../data/data.module";
import { RewardsModule } from "src/rewards/rewards.module";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";

@Module({
    imports: [DataModule, RewardsModule],
    controllers: [InventoryController],
    providers: [InventoryService]
})
export class InventoryModule {}

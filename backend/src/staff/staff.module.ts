import { Module } from "@nestjs/common";
import { StaffService } from "./staff.service";
import { StaffController } from "./staff.controller";
import { StaffCmsService } from "./staff-cms.service";
import { StaffCmsController } from "./staff-cms.controller";

@Module({
    imports: [],
    providers: [StaffService, StaffCmsService],
    controllers: [StaffController, StaffCmsController]
})
export class StaffModule {}

import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StaffCmsService } from "./staff-cms.service";
import { GetCurrentUser, Permissions } from "src/core/decorator";
import {
    PermissionTypeEnum,
    StaffAdminCreateBlookDto,
    StaffAdminCreatePackDto,
    StaffAdminCreateRarityDto,
    StaffAdminCreateResourceDto,
    StaffAdminUpdateBlookDto,
    StaffAdminUpdatePackDto,
    StaffAdminUpdateRarityDto,
    StaffAdminUpdateResourceDto
} from "@blacket/types";

@ApiTags("staff-cms")
@Controller("staff/cms")
export class StaffCmsController {
    constructor(private readonly staffCmsService: StaffCmsService) { }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Post("resources")
    async createResource(@GetCurrentUser() requesterId: string, @Body() dto: StaffAdminCreateResourceDto) {
        return await this.staffCmsService.createResource(requesterId, dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Patch("resources/:id")
    async updateResource(@GetCurrentUser() requesterId: string, @Param("id") id: string, @Body() dto: StaffAdminUpdateResourceDto) {
        return await this.staffCmsService.updateResource(requesterId, Number(id), dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Get("rarities")
    async listRarities() {
        return await this.staffCmsService.listRarities();
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Post("rarities")
    async createRarity(@GetCurrentUser() requesterId: string, @Body() dto: StaffAdminCreateRarityDto) {
        return await this.staffCmsService.createRarity(requesterId, dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Patch("rarities/:id")
    async updateRarity(@GetCurrentUser() requesterId: string, @Param("id") id: string, @Body() dto: StaffAdminUpdateRarityDto) {
        return await this.staffCmsService.updateRarity(requesterId, Number(id), dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Get("blooks")
    async listBlooks(@Query("search") search?: string) {
        return await this.staffCmsService.listBlooks(search);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Post("blooks")
    async createBlook(@GetCurrentUser() requesterId: string, @Body() dto: StaffAdminCreateBlookDto) {
        return await this.staffCmsService.createBlook(requesterId, dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Patch("blooks/:id")
    async updateBlook(@GetCurrentUser() requesterId: string, @Param("id") id: string, @Body() dto: StaffAdminUpdateBlookDto) {
        return await this.staffCmsService.updateBlook(requesterId, Number(id), dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Delete("blooks/:id")
    async deleteBlook(@GetCurrentUser() requesterId: string, @Param("id") id: string) {
        return await this.staffCmsService.deleteBlook(requesterId, Number(id));
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Put("blooks/:id/pack")
    async setBlookPack(@GetCurrentUser() requesterId: string, @Param("id") id: string, @Body() dto: { packId: number | null }) {
        return await this.staffCmsService.setBlookPack(requesterId, Number(id), dto.packId);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Get("packs")
    async listPacks() {
        return await this.staffCmsService.listPacks();
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Post("packs")
    async createPack(@GetCurrentUser() requesterId: string, @Body() dto: StaffAdminCreatePackDto) {
        return await this.staffCmsService.createPack(requesterId, dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Patch("packs/:id")
    async updatePack(@GetCurrentUser() requesterId: string, @Param("id") id: string, @Body() dto: StaffAdminUpdatePackDto) {
        return await this.staffCmsService.updatePack(requesterId, Number(id), dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Delete("packs/:id")
    async deletePack(@GetCurrentUser() requesterId: string, @Param("id") id: string) {
        return await this.staffCmsService.deletePack(requesterId, Number(id));
    }
}

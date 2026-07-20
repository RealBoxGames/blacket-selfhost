import { Body, Controller, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StaffService } from "./staff.service";
import { GetCurrentUser, Permissions } from "src/core/decorator";
import {
    PermissionTypeEnum,
    StaffAdminEditUserCurrencyDto,
    StaffAdminEditUserGroupsDto,
    StaffAdminGiveTokensDto,
    StaffAdminGiveUserBlookDto,
    StaffAdminSetUserAvatarDto
} from "@blacket/types";

@ApiTags("staff")
@Controller("staff")
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Get("users")
    async searchUsers(@Query("search") search?: string) {
        return await this.staffService.searchUsers(search);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Get("users/:id")
    async getUser(@Param("id") id: string) {
        return await this.staffService.getUser(id);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Patch("users/:id/currency")
    async editCurrency(@Param("id") id: string, @Body() dto: StaffAdminEditUserCurrencyDto) {
        return await this.staffService.editCurrency(id, dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_USER_BLOOKS] })
    @Post("users/:id/blooks")
    async giveBlook(@Param("id") id: string, @Body() dto: StaffAdminGiveUserBlookDto) {
        return await this.staffService.giveBlook(id, dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Patch("users/:id/avatar")
    async setAvatar(@Param("id") id: string, @Body() dto: StaffAdminSetUserAvatarDto) {
        return await this.staffService.setAvatar(id, dto);
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_DATA] })
    @Get("groups")
    async listGroups() {
        return await this.staffService.listGroups();
    }

    @Permissions({ permissions: [PermissionTypeEnum.MANAGE_USER_GROUPS] })
    @Put("users/:id/groups")
    async editGroups(@GetCurrentUser() requesterId: string, @Param("id") id: string, @Body() dto: StaffAdminEditUserGroupsDto) {
        return await this.staffService.editGroups(requesterId, id, dto);
    }

    @Post("give")
    async giveTokens(@GetCurrentUser() requesterId: string, @Body() dto: StaffAdminGiveTokensDto) {
        return await this.staffService.giveTokens(requesterId, dto);
    }
}

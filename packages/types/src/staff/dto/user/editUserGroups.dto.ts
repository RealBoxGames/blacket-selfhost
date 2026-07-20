import { IsArray, IsInt } from "class-validator";

export class StaffAdminEditUserGroupsDto {
    @IsArray()
    @IsInt({ each: true })
    readonly groupIds: number[];
}

export default StaffAdminEditUserGroupsDto;

import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post
} from "@nestjs/common";
import { FriendsService } from "./friends.service";
import { ApiTags } from "@nestjs/swagger";
import { GetCurrentUser } from "src/core/decorator";
import { FriendsFriendsEntity } from "@blacket/types";

@ApiTags("friends")
@Controller("friends")
export class FriendsController {
    constructor(private readonly friendsService: FriendsService) { }

    @Get("/")
    async getFriends(@GetCurrentUser() userId: string) {
        const friends = await this.friendsService.getFriends(userId);

        return new FriendsFriendsEntity(friends);
    }

    @Post(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async addFriend(@GetCurrentUser() userId: string, @Param("id") id: string) {
        return await this.friendsService.addFriend(userId, id);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeFriend(@GetCurrentUser() userId: string, @Param("id") id: string) {
        return await this.friendsService.removeFriend(userId, id);
    }

    @Post(":id/block")
    @HttpCode(HttpStatus.NO_CONTENT)
    async blockUser(@GetCurrentUser() userId: string, @Param("id") id: string) {
        return await this.friendsService.blockUser(userId, id);
    }

    @Post(":id/unblock")
    async unblockUser(@GetCurrentUser() userId: string, @Param("id") id: string) {
        return await this.friendsService.unblockUser(userId, id);
    }

    @Post(":id/revoke")
    @HttpCode(HttpStatus.NO_CONTENT)
    async revokeRequest(@GetCurrentUser() userId: string, @Param("id") id: string) {
        return await this.friendsService.revokeRequest(userId, id);
    }

    @Post(":id/decline")
    @HttpCode(HttpStatus.NO_CONTENT)
    async declineRequest(@GetCurrentUser() userId: string, @Param("id") id: string) {
        return await this.friendsService.declineRequest(userId, id);
    }
}

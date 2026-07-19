import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ApiTags } from "@nestjs/swagger";
import { GetCurrentUser } from "src/core/decorator";
import { ChatCreateMessageDto, ChatEditMessageDto } from "@blacket/types";
import { seconds, Throttle } from "@nestjs/throttler";

@ApiTags("chat")
@Controller("chat")
export class ChatController {
    constructor(private chatService: ChatService) {}

    @Throttle({ global: { limit: 1, ttl: seconds(1) } })
    @Get("messages/:roomId")
    async getMessages(@GetCurrentUser() userId: string,
        @Param("roomId", ParseIntPipe) roomId: number,) {
        return await this.chatService.getMessages(userId, roomId);
    }

    @Throttle({ global: { limit: 1, ttl: seconds(1) } })
    @Post("messages/:roomId")
    async createMessage(@GetCurrentUser() userId: string,
        @Param("roomId", ParseIntPipe) roomId: number,
        @Body() dto: ChatCreateMessageDto,) {
        return await this.chatService.createMessage(userId, roomId, dto);
    }

    @Throttle({ global: { limit: 4, ttl: seconds(2) } })
    @Post("messages/:roomId/start-typing")
    @HttpCode(HttpStatus.NO_CONTENT)
    async startTyping(@GetCurrentUser() userId: string,
        @Param("roomId", ParseIntPipe) roomId: number,) {
        return await this.chatService.startTyping(userId, roomId);
    }

    @Throttle({ global: { limit: 1, ttl: seconds(1) } })
    @Delete("messages/:roomId/:messageId")
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteMessage(@GetCurrentUser() userId: string,
        @Param("roomId", ParseIntPipe) roomId: number,
        @Param("messageId") messageId: string,) {
        return await this.chatService.deleteMessage(userId, roomId, messageId);
    }

    @Throttle({ global: { limit: 1, ttl: seconds(1) } })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Put("messages/:roomId/:messageId")
    async editMessage(@GetCurrentUser() userId: string,
        @Param("roomId", ParseIntPipe) roomId: number,
        @Param("messageId") messageId: string,
        @Body() dto: ChatEditMessageDto,) {
        return await this.chatService.editMessage(userId, roomId, messageId, dto,);
    }
}

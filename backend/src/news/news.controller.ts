import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post
} from "@nestjs/common";
import { NewsService } from "./news.service";
import { GetCurrentUser } from "src/core/decorator";
import { ApiTags } from "@nestjs/swagger";
import { seconds, Throttle } from "@nestjs/throttler";
import { NewsNewsPostEntity, NewsVoteDto } from "@blacket/types";

@ApiTags("news")
@Controller("news")
export class NewsController {
    constructor(private readonly newsService: NewsService) {}

    @Throttle({ global: { limit: 1, ttl: seconds(10) } })
    @Get()
    async getNews(@GetCurrentUser() userId: string) {
        return (await this.newsService.getNews(userId)).map((post) => new NewsNewsPostEntity(post),);
    }

    @Throttle({ global: { limit: 2, ttl: seconds(10) } })
    @Post(":id/vote")
    @HttpCode(HttpStatus.NO_CONTENT)
    vote(@GetCurrentUser() userId: string,
        @Param("id", ParseIntPipe) newsPostId: number,
        @Body() dto: NewsVoteDto,) {
        return this.newsService.upsertVote(userId, newsPostId, dto);
    }

    @Throttle({ global: { limit: 1, ttl: seconds(10) } })
    @Delete(":id/vote")
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteVote(@GetCurrentUser() userId: string,
        @Param("id", ParseIntPipe) newsPostId: number,) {
        return this.newsService.deleteVote(userId, newsPostId);
    }
}

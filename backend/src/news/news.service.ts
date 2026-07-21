import { NewsCreateDto, NewsNewsPostEntity, NewsVoteDto } from "@blacket/types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { OwnerTierService } from "src/core/ownerTier.service";
import { NotFound } from "@blacket/types";

@Injectable()
export class NewsService {
    constructor(private prismaService: PrismaService,
        private readonly ownerTierService: OwnerTierService,) {}

    async createNewsPost(requesterId: string, dto: NewsCreateDto) {
        await this.ownerTierService.assert(requesterId);

        return await this.prismaService.newsPost.create({
            data: {
                title: dto.title,
                content: dto.content,
                imageId: dto.imageId,
                imageUrl: dto.imageUrl,
                authorId: requesterId
            }
        });
    }

    async deleteNewsPost(requesterId: string, id: number) {
        await this.ownerTierService.assert(requesterId);

        const post = await this.prismaService.newsPost.findUnique({ where: { id } });
        if (!post) throw new NotFoundException(NotFound.DEFAULT);

        await this.prismaService.newsPost.delete({ where: { id } });
    }

    async getNews(userId: string): Promise<NewsNewsPostEntity[]> {
        const rawNews = await this.prismaService.newsPost.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                image: true,
                author: true,
                votes: true
            }
        });

        const news: NewsNewsPostEntity[] = [];

        for (const post of rawNews) {
            const constructedPost: NewsNewsPostEntity = {
                ...post,
                votes: { upvotes: 0, downvotes: 0 }
            };

            const myVote = post.votes.find((vote) => vote.userId === userId);
            if (myVote) constructedPost.myVote = myVote.vote;

            for (const vote of post.votes) {
                if (vote.vote) constructedPost.votes.upvotes++;
                else constructedPost.votes.downvotes++;
            }

            news.push(constructedPost);
        }

        return news;
    }

    async upsertVote(userId: string,
        newsPostId: number,
        dto: NewsVoteDto,): Promise<void> {
        const post = await this.prismaService.newsPost.findUnique({
            where: { id: newsPostId }
        });
        if (!post) return;

        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });
        if (!user) return;

        const vote = await this.prismaService.userNewsPostVote.findFirst({
            where: {
                newsPostId: newsPostId,
                userId: userId
            }
        });

        if (vote) await this.prismaService.userNewsPostVote.update({
                where: { id: vote.id },
                data: {
                    vote: dto.value
                }
            });
        else await this.prismaService.userNewsPostVote.create({
                data: {
                    userId,
                    newsPostId,
                    vote: dto.value
                }
            });
    }

    async deleteVote(userId: string, newsPostId: number) {
        const vote = await this.prismaService.userNewsPostVote.findFirst({
            where: {
                newsPostId,
                userId
            }
        });
        if (!vote) return;

        await this.prismaService.userNewsPostVote.delete({
            where: { id: vote.id }
        });
    }
}

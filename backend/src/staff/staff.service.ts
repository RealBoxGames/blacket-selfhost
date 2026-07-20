import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";
import { SUPER_ADMIN_USERNAME } from "src/core/constants";
import {
    Forbidden,
    NotFound,
    StaffAdminEditUserCurrencyDto,
    StaffAdminEditUserGroupsDto,
    StaffAdminGiveTokensDto,
    StaffAdminGiveUserBlookDto,
    StaffAdminSetUserAvatarDto,
    StaffUserEntity
} from "@blacket/types";
import { BlookObtainMethod } from "@blacket/core";

const USER_SELECT = {
    id: true,
    username: true,
    tokens: true,
    diamonds: true,
    crystals: true,
    createdAt: true,
    avatar: { select: { blookId: true, shiny: true } },
    groups: { select: { id: true, name: true, priority: true } }
};

@Injectable()
export class StaffService {
    constructor(private readonly prismaService: PrismaService,
        private readonly redisService: RedisService,) {}

    private toEntity(user: any): StaffUserEntity {
        return new StaffUserEntity({
            id: user.id,
            username: user.username,
            tokens: user.tokens,
            diamonds: user.diamonds,
            crystals: user.crystals,
            createdAt: user.createdAt,
            avatarBlookId: user.avatar?.blookId ?? null,
            avatarShiny: user.avatar?.shiny ?? false,
            groups: user.groups
        });
    }

    private async assertIsSuperAdmin(userId: string): Promise<void> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: { username: true }
        });

        if (!user || user.username !== SUPER_ADMIN_USERNAME) throw new ForbiddenException(Forbidden.STAFF_ONLY_OWNER);
    }

    async searchUsers(search?: string): Promise<StaffUserEntity[]> {
        const users = await this.prismaService.user.findMany({
            where: search ? { username: { contains: search, mode: "insensitive" } } : {},
            select: USER_SELECT,
            orderBy: { createdAt: "desc" },
            take: 50
        });

        return users.map((user) => this.toEntity(user));
    }

    async getUser(id: string): Promise<StaffUserEntity> {
        const user = await this.prismaService.user.findUnique({
            where: { id },
            select: USER_SELECT
        });
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

        return this.toEntity(user);
    }

    async editCurrency(id: string, dto: StaffAdminEditUserCurrencyDto): Promise<StaffUserEntity> {
        const user = await this.prismaService.user.findUnique({ where: { id }, select: { id: true } });
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

        await this.prismaService.user.update({
            where: { id },
            data: {
                ...(dto.tokens !== undefined ? { tokens: dto.tokens } : {}),
                ...(dto.diamonds !== undefined ? { diamonds: dto.diamonds } : {}),
                ...(dto.crystals !== undefined ? { crystals: dto.crystals } : {})
            }
        });

        return this.getUser(id);
    }

    private async nextSerial(blookId: number, shiny: boolean): Promise<number> {
        const last = await this.prismaService.userBlook.findFirst({
            where: { blookId, shiny },
            orderBy: { serial: "desc" },
            select: { serial: true }
        });

        return (last?.serial ?? 0) + 1;
    }

    async giveBlook(id: string, dto: StaffAdminGiveUserBlookDto) {
        const user = await this.prismaService.user.findUnique({ where: { id }, select: { id: true } });
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

        const blook = await this.redisService.getBlook(dto.blookId);
        if (!blook) throw new NotFoundException(NotFound.UNKNOWN_BLOOK);

        const shiny = dto.shiny ?? false;
        const serial = await this.nextSerial(dto.blookId, shiny);

        return await this.prismaService.userBlook.create({
            data: {
                userId: id,
                initialObtainerId: id,
                blookId: dto.blookId,
                shiny,
                obtainedBy: BlookObtainMethod.STAFF,
                serial
            }
        });
    }

    async setAvatar(id: string, dto: StaffAdminSetUserAvatarDto): Promise<StaffUserEntity> {
        const user = await this.prismaService.user.findUnique({ where: { id }, select: { id: true } });
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

        const blook = await this.redisService.getBlook(dto.blookId);
        if (!blook) throw new NotFoundException(NotFound.UNKNOWN_BLOOK);

        const shiny = dto.shiny ?? false;
        const serial = await this.nextSerial(dto.blookId, shiny);

        const userBlook = await this.prismaService.userBlook.create({
            data: {
                userId: id,
                initialObtainerId: id,
                blookId: dto.blookId,
                shiny,
                obtainedBy: BlookObtainMethod.STAFF,
                serial
            }
        });

        await this.prismaService.user.update({
            where: { id },
            data: {
                avatar: { connect: { id: userBlook.id } },
                customAvatar: { disconnect: true }
            }
        });

        return this.getUser(id);
    }

    async listGroups() {
        return await this.prismaService.group.findMany({
            select: { id: true, name: true, priority: true },
            orderBy: { priority: "desc" }
        });
    }

    async editGroups(requesterId: string, id: string, dto: StaffAdminEditUserGroupsDto): Promise<StaffUserEntity> {
        await this.assertIsSuperAdmin(requesterId);

        const user = await this.prismaService.user.findUnique({ where: { id }, select: { id: true } });
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

        const groups = await this.prismaService.group.findMany({ where: { id: { in: dto.groupIds } }, select: { id: true } });
        if (groups.length !== dto.groupIds.length) throw new NotFoundException(NotFound.UNKNOWN_GROUP);

        await this.prismaService.user.update({
            where: { id },
            data: {
                groups: { set: dto.groupIds.map((groupId) => ({ id: groupId })) }
            }
        });

        return this.getUser(id);
    }

    async giveTokens(requesterId: string, dto: StaffAdminGiveTokensDto): Promise<{ username: string; tokens: number }> {
        await this.assertIsSuperAdmin(requesterId);

        const user = await this.prismaService.user.findFirst({
            where: { username: { equals: dto.username, mode: "insensitive" } },
            select: { id: true, username: true }
        });
        if (!user) throw new NotFoundException(NotFound.UNKNOWN_USER);

        await this.prismaService.user.update({
            where: { id: user.id },
            data: { tokens: { increment: dto.tokens } }
        });

        return { username: user.username, tokens: dto.tokens };
    }
}

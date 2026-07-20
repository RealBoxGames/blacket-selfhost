import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";
import { OWNER_TIER_GROUPS } from "src/core/constants";
import {
    Forbidden,
    NotFound,
    StaffAdminCreateBlookDto,
    StaffAdminCreatePackDto,
    StaffAdminCreateRarityDto,
    StaffAdminCreateResourceDto,
    StaffAdminUpdateBlookDto,
    StaffAdminUpdatePackDto,
    StaffAdminUpdateRarityDto,
    StaffAdminUpdateResourceDto
} from "@blacket/types";

@Injectable()
export class StaffCmsService {
    constructor(private readonly prismaService: PrismaService,
        private readonly redisService: RedisService,) {}

    private async assertIsOwnerOrDeveloper(userId: string): Promise<void> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: { groups: { select: { name: true } } }
        });

        const isOwnerTier = user?.groups.some((group) => OWNER_TIER_GROUPS.includes(group.name)) ?? false;
        if (!isOwnerTier) throw new ForbiddenException(Forbidden.STAFF_ONLY_OWNER);
    }

    // --- Resources ---

    async createResource(requesterId: string, dto: StaffAdminCreateResourceDto) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const resource = await this.prismaService.resource.create({ data: { path: dto.path } });
        await this.redisService.setResource(resource.id, resource);

        return resource;
    }

    async updateResource(requesterId: string, id: number, dto: StaffAdminUpdateResourceDto) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const resource = await this.prismaService.resource.update({ where: { id }, data: { path: dto.path } });
        await this.redisService.setResource(resource.id, resource);

        return resource;
    }

    // --- Rarities ---

    async listRarities() {
        return await this.prismaService.rarity.findMany({ orderBy: { priority: "desc" } });
    }

    async createRarity(requesterId: string, dto: StaffAdminCreateRarityDto) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const rarity = await this.prismaService.rarity.create({ data: dto });
        await this.redisService.setRarity(rarity.id, rarity);

        return rarity;
    }

    async updateRarity(requesterId: string, id: number, dto: StaffAdminUpdateRarityDto) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const rarity = await this.prismaService.rarity.update({ where: { id }, data: dto });
        await this.redisService.setRarity(rarity.id, rarity);

        return rarity;
    }

    // --- Blooks ---

    async listBlooks(search?: string) {
        return await this.prismaService.blook.findMany({
            where: search ? { name: { contains: search, mode: "insensitive" } } : {},
            orderBy: { priority: "desc" },
            take: 100
        });
    }

    async createBlook(requesterId: string, dto: StaffAdminCreateBlookDto) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const blook = await this.prismaService.blook.create({ data: dto });
        await this.redisService.setBlook(blook.id, blook);

        return blook;
    }

    async updateBlook(requesterId: string, id: number, dto: StaffAdminUpdateBlookDto) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const blook = await this.prismaService.blook.findUnique({ where: { id } });
        if (!blook) throw new NotFoundException(NotFound.UNKNOWN_BLOOK);

        const updated = await this.prismaService.blook.update({ where: { id }, data: dto });
        await this.redisService.setBlook(updated.id, updated);

        return updated;
    }

    async deleteBlook(requesterId: string, id: number) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const blook = await this.prismaService.blook.findUnique({ where: { id } });
        if (!blook) throw new NotFoundException(NotFound.UNKNOWN_BLOOK);

        await this.prismaService.blook.delete({ where: { id } });
        await this.redisService.deleteBlook(id);
    }

    // --- Packs ---

    async listPacks() {
        return await this.prismaService.pack.findMany({
            orderBy: { priority: "desc" },
            include: { blook: { select: { id: true, name: true } } }
        });
    }

    async createPack(requesterId: string, dto: StaffAdminCreatePackDto) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const pack = await this.prismaService.pack.create({ data: dto });
        await this.redisService.setPack(pack.id, pack);

        return pack;
    }

    async updatePack(requesterId: string, id: number, dto: StaffAdminUpdatePackDto) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const pack = await this.prismaService.pack.findUnique({ where: { id } });
        if (!pack) throw new NotFoundException(NotFound.UNKNOWN_PACK);

        const updated = await this.prismaService.pack.update({ where: { id }, data: dto });
        await this.redisService.setPack(updated.id, updated);

        return updated;
    }

    async deletePack(requesterId: string, id: number) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const pack = await this.prismaService.pack.findUnique({
            where: { id },
            include: { blook: { select: { id: true }, take: 1 } }
        });
        if (!pack) throw new NotFoundException(NotFound.UNKNOWN_PACK);
        if (pack.blook.length > 0) throw new ConflictException("Remove or reassign this pack's blooks before deleting it.");

        await this.prismaService.pack.delete({ where: { id } });
        await this.redisService.deletePack(id);
    }

    async setBlookPack(requesterId: string, blookId: number, packId: number | null) {
        await this.assertIsOwnerOrDeveloper(requesterId);

        const blook = await this.prismaService.blook.findUnique({ where: { id: blookId } });
        if (!blook) throw new NotFoundException(NotFound.UNKNOWN_BLOOK);

        const updated = await this.prismaService.blook.update({ where: { id: blookId }, data: { packId } });
        await this.redisService.setBlook(updated.id, updated);

        return updated;
    }
}

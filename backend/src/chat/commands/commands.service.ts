import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ChatService } from "../chat.service";
import { OwnerTierService } from "src/core/ownerTier.service";
import { ChatCommandEntity, NotFound } from "@blacket/types";
import { BlookObtainMethod } from "@blacket/core";

const BOT_USERNAME = "Blacket";

interface CommandDefinition {
    name: string;
    description: string;
    usage: string;
    ownerTierOnly?: boolean;
    execute: (requesterId: string, args: string) => Promise<string>;
}

@Injectable()
export class CommandsService {
    private botUserId: string | null = null;

    constructor(private readonly prismaService: PrismaService,
        private readonly chatService: ChatService,
        private readonly ownerTierService: OwnerTierService,) {}

    private readonly commands: CommandDefinition[] = [
        {
            name: "ping",
            description: "Check if the bot is responsive.",
            usage: "/ping",
            execute: async () => "🏓 Pong!"
        },
        {
            name: "give",
            description: "Give a user tokens or a blook.",
            usage: "/give <username> tokens <amount>  or  /give <username> blook <blook name> [shiny]",
            ownerTierOnly: true,
            execute: async (_requesterId, args) => this.executeGive(args)
        }
    ];

    async listCommandsForUser(userId: string): Promise<ChatCommandEntity[]> {
        const isOwnerTier = await this.isOwnerTier(userId);

        return this.commands
            .filter((command) => !command.ownerTierOnly || isOwnerTier)
            .map((command) => new ChatCommandEntity({ name: command.name, description: command.description, usage: command.usage }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    private async isOwnerTier(userId: string): Promise<boolean> {
        try {
            await this.ownerTierService.assert(userId);
            return true;
        } catch {
            return false;
        }
    }

    private async getBotUserId(): Promise<string> {
        if (this.botUserId) return this.botUserId;

        const bot = await this.prismaService.user.findUnique({
            where: { username: BOT_USERNAME },
            select: { id: true }
        });
        if (!bot) throw new NotFoundException(NotFound.DEFAULT);

        this.botUserId = bot.id;

        return bot.id;
    }

    async executeCommand(requesterId: string, roomId: number, commandName: string, args: string): Promise<void> {
        const command = this.commands.find((c) => c.name === commandName.toLowerCase());
        if (!command) throw new NotFoundException(NotFound.DEFAULT);

        if (command.ownerTierOnly) await this.ownerTierService.assert(requesterId);

        const resultText = await command.execute(requesterId, args ?? "");

        const botUserId = await this.getBotUserId();
        await this.chatService.createBotMessage(botUserId, roomId, resultText);
    }

    private async executeGive(argsRaw: string): Promise<string> {
        const args = argsRaw.trim().split(/\s+/).filter(Boolean);
        if (args.length < 3) return "Usage: /give <username> tokens <amount>  or  /give <username> blook <blook name> [shiny]";

        const [username, subtype, ...rest] = args;

        const user = await this.prismaService.user.findFirst({
            where: { username: { equals: username, mode: "insensitive" } },
            select: { id: true, username: true }
        });
        if (!user) return `Could not find a user named "${username}".`;

        if (subtype.toLowerCase() === "tokens") {
            const amount = Number(rest[0]);
            if (!amount || amount <= 0) return "Enter a positive token amount.";

            await this.prismaService.user.update({
                where: { id: user.id },
                data: { tokens: { increment: amount } }
            });

            return `Gave ${amount.toLocaleString()} tokens to ${user.username}.`;
        }

        if (subtype.toLowerCase() === "blook") {
            const shiny = rest.some((word) => word.toLowerCase() === "shiny");
            const blookName = rest.filter((word) => word.toLowerCase() !== "shiny").join(" ");

            const blook = await this.prismaService.blook.findFirst({
                where: { name: { equals: blookName, mode: "insensitive" } }
            });
            if (!blook) return `Could not find a blook named "${blookName}".`;

            const last = await this.prismaService.userBlook.findFirst({
                where: { blookId: blook.id, shiny },
                orderBy: { serial: "desc" },
                select: { serial: true }
            });
            const serial = (last?.serial ?? 0) + 1;

            await this.prismaService.userBlook.create({
                data: {
                    userId: user.id,
                    initialObtainerId: user.id,
                    blookId: blook.id,
                    shiny,
                    obtainedBy: BlookObtainMethod.STAFF,
                    serial
                }
            });

            return `Gave ${user.username} a${shiny ? " shiny" : ""} ${blook.name}.`;
        }

        return "Usage: /give <username> tokens <amount>  or  /give <username> blook <blook name> [shiny]";
    }
}

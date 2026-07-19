import { Pack } from "@blacket/core";
import { ChatInputCommandInteraction, inlineCode } from "discord.js";

export async function resolvePackNameToId(interaction: ChatInputCommandInteraction<'cached'>, packName: string): Promise<number> {
    const pack = await interaction.client.prisma.pack.findFirst({
        where: {
            name: packName
        },
        select: {
            id: true
        }
    });

    if (!pack) throw new Error(`No pack with the name ${inlineCode(packName)}!`);

    return pack.id;
}

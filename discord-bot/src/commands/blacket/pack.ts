import { EmbedBuilder, type ChatInputCommandInteraction, ApplicationCommandOptionType, MessageFlags } from 'discord.js';

import type { Command } from '../../structures/command.js';
import Emojis from '../../misc/emojis.js';
import { ResourcePathTransformer } from '../../misc/transformer.js';
import path from 'node:path';
import fs from 'node:fs';

export default {
    data: {
        name: 'pack',
        description: 'View pack information.',
        options: [
            {
                name: 'pack',
                type: ApplicationCommandOptionType.String,
                description: 'Pack to see information about.',
                autocomplete: true,
                required: true
            }
        ]
    },
    opt: {
        userPermissions: ['SendMessages'],
        botPermissions: ['SendMessages'],
        category: 'Blacket',
        cooldown: 5,
        favourite: true
    },
    async execute(interaction: ChatInputCommandInteraction<'cached'>) {
        const packName = interaction.options.getString('pack', true);

        const pack = await interaction.client.prisma.pack.findFirst({
            where: {
                name: packName
            },
            include: {
                image: true
            }
        });

        if (!pack) {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Pack not found')
                        .setDescription(`No pack found for name of ${packName}!`)
                        .setColor('#FF0000')
                ],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(packName)
            .setDescription(`${Emojis.Token} **Price:** ${pack?.price ?? 'N/A'}\n\n** **`)
            .setThumbnail(ResourcePathTransformer(pack.image.path));

        const packBlooks = await interaction.client.redis.getBlooksFromPack(pack.id);
        const sortedPackBlooks = packBlooks.sort((a, b) => a.priority - b.priority);
        const totalChance = packBlooks.reduce((acc, blook) => acc + blook.chance, 0);
        const blooksByRarity = sortedPackBlooks.reduce((acc, blook) => {
            if (!blook.rarityId) {
                return acc;
            }
            if (!acc[blook.rarityId]) {
                acc[blook.rarityId] = [];
            }
            acc[blook.rarityId].push(blook);
            return acc;
        }, {});

        const fields = [];

        for (const rarityId of Object.keys(blooksByRarity)) {
            const rarityBlooks = blooksByRarity[rarityId];
            const rarity = await interaction.client.redis.getRarityNameFromId(Number(rarityId));
            const emoji = await Emojis[rarity.name] || Emojis.Common;
            const blooks = [];

            for (const blook of rarityBlooks) {
                const chance = (blook.chance / totalChance) * 100;
                blooks.push(`-# - **${blook.name}** (${chance > 1 ? chance.toFixed(1) : chance.toFixed(3)}%)`);
            }

            fields.push({
                name: `${emoji} ${rarity.name}`,
                value: blooks.join('\n'),
                inline: true
            })
        }

        const halfwayThrough = Math.floor(fields.length / 2)

        const arrayFirstHalf = fields.slice(0, halfwayThrough);
        const arraySecondHalf = fields.slice(halfwayThrough, fields.length);

        for (let i = 0; i < arrayFirstHalf.length; i++) {
            if (arraySecondHalf[i]) {
                embed.addFields(arrayFirstHalf[i], arraySecondHalf[i])
            } else {
                embed.addFields(arrayFirstHalf[i]);
            }

            embed.addFields({
                name: '** **',
                value: '** **'
            })
        }

        await interaction.reply({
            embeds: [embed]
        });
    }
} satisfies Command;

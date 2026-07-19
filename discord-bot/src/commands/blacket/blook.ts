import { EmbedBuilder, type ChatInputCommandInteraction, ApplicationCommandOptionType, ColorResolvable, MessageFlags } from 'discord.js';

import type { Command } from '../../structures/command.js';
import Emojis from '../../misc/emojis.js';
import { ResourcePathTransformer } from '../../misc/transformer.js';

export default {
    data: {
        name: 'blook',
        description: 'View blook information.',
        options: [
            {
                name: 'blook',
                type: ApplicationCommandOptionType.String,
                description: 'Blook to see information about.',
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
        const blookName = interaction.options.getString('blook', true);

        const blook = await interaction.client.prisma.blook.findFirst({
            where: {
                name: blookName
            },
            include: {
                image: true,
                rarity: true,
                pack: true,
                userBlooks: true
            }
        });

        if (!blook) {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Blook not found')
                        .setDescription(`No blook found for name of ${blookName}!`)
                        .setColor('#FF0000')
                ],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const userBlookCount: Record<string, number> = {};
        for (const userBlook of blook.userBlooks) {
            userBlookCount[userBlook.userId] = (userBlookCount[userBlook.userId] || 0) + 1;
        }

        const sortedUserBlookCount = await Promise.all(Object.entries(userBlookCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(async ([userId, count], index) => {
                // userid is a blacket id, not a discord id
                const user = await interaction.client.prisma.user.findFirst({
                    where: {
                        id: userId
                    },
                    select: {
                        username: true
                    }
                });

                return `${index + 1}. **${user ? user.username : 'Unknown User'}** - \`\`${count}\`\``;
            }));

        const packBlooks = await interaction.client.redis.getBlooksFromPack(blook?.pack?.id);
        const totalChance = packBlooks.reduce((acc, blook) => acc + blook.chance, 0);
        const chance = (blook.chance / totalChance) * 100;
        const displayChance = chance > 1 ? chance.toFixed(1) : chance.toFixed(3);
        const color = ((blook.rarity?.color === 'rainbow' ? 'Random' : blook.rarity?.color) ?? '#FFFFFF') as ColorResolvable;

        const embed = new EmbedBuilder()
            .setTitle(blookName)
            .addFields(
                {
                    name: '__``Details``__',
                    value: `${Emojis[blook?.rarity?.name ?? "Common"]} **Rarity:** ${blook?.rarity?.name ?? 'N/A'}\n${Emojis.Chance} **Chance:** ${isNaN(chance) ? "0" : displayChance}%\n${Emojis.Token} **Price:** ${blook?.price ?? 'N/A'}`,
                    inline: true
                },
                {
                    name: '** **',
                    // todo: add auction count when can be bothered, \n${Emojis.Unlocked} **Amount up for auction:** ${blook?.quantity?.locked ?? 'N/A'}
                    value: `${Emojis.PacksOpened} **Pack:** ${blook?.pack?.name ?? 'N/A'}\n${Emojis.Unlocked} **Total in circulation:** ${blook?.userBlooks?.length ?? 'N/A'}`,
                    inline: true
                },
                {
                    name: '** **',
                    value: '** **'
                },
                {
                    name: '__``Top 10 Users``__',
                    value: sortedUserBlookCount.length > 0
                        ? sortedUserBlookCount
                            .slice(0, 5)
                            .join('\n')
                        : 'No users have this blook yet.',
                    inline: true
                }
            )
            .setThumbnail(ResourcePathTransformer(blook.image.path))
            .setColor(color)

        if (sortedUserBlookCount.length > 5) embed.addFields({
            name: '** **',
            value: sortedUserBlookCount.slice(5).join('\n'),
            inline: true
        })

        interaction.reply({ embeds: [embed] });
    }
} satisfies Command;

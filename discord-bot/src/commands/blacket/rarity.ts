import { EmbedBuilder, type ChatInputCommandInteraction, ApplicationCommandOptionType, ColorResolvable, ContainerBuilder, MessageFlags } from 'discord.js';

import type { Command } from '../../structures/command.js';
import Emojis from '../../misc/emojis.js';
import { ResourcePathTransformer } from '../../misc/transformer.js';

export default {
    data: {
        name: 'rarity',
        description: 'View rarity information.',
        options: [
            {
                name: 'rarity',
                type: ApplicationCommandOptionType.String,
                description: 'Rarity to see information about.',
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
        const rarityName = interaction.options.getString('rarity', true);

        const rarity = await interaction.client.prisma.rarity.findFirst({
            where: {
                name: rarityName
            },
            include: {
                image: true,
                blook: true,
                item: true
            }
        });

        if (!rarity) {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Rarity not found')
                        .setDescription(`No rarity found for name of ${rarityName}!`)
                        .setColor('#FF0000')
                ],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const container = new ContainerBuilder()
            .setAccentColor(parseInt(rarity.color.slice(1), 16)) // discord.js is stupid, WHY IS COLORRESOLVABLE NOT USED FOR THIS?
            .addSectionComponents(
                section => section
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(`## ${rarity.name}\n${Emojis.Experience} **Experience:** ${rarity.experience}\n${Emojis.Unlocked} **Blooks:** ${rarity.blook.length}\n${Emojis.Unlocked} **Items:** ${rarity.item.length}`),
                    )
                    .setThumbnailAccessory(
                        thumbnail => thumbnail.setURL(ResourcePathTransformer(rarity.image.path)
                        )
                    )
            )


        interaction.reply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }
} satisfies Command;

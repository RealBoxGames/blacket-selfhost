import { type StringSelectMenuInteraction, inlineCode, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, bold, ComponentType, MessageFlags } from 'discord.js';

import { SelectMenu } from '../../structures/selectMenu.js';

export default {
    data: {
        custom_id: 'help-menu',
        type: ComponentType.StringSelect
    },
    async execute(interaction: StringSelectMenuInteraction<'cached'>) {
        if (interaction.user.id !== interaction.message.interaction.user.id) {
            const failedEmbed = new EmbedBuilder()
                .setTitle('❌ Error: Select Menu')
                .setDescription('You are not allowed to use this select menu.')
                .setColor(0x990000)
                .setTimestamp();

            await interaction.reply({ embeds: [failedEmbed], flags: [MessageFlags.Ephemeral] });
            return;
        }

        const selectedCategory = interaction.values[0];

        const commands = interaction.client.commands;

        const embed = new EmbedBuilder()
            .setTitle(`${selectedCategory} Commands`)
            .addFields(commands
                .filter(cmd => (cmd.opt?.category ?? "Uncategorized") === selectedCategory)
                .map(cmd => ({
                    name: `・ ${cmd.data.name}`,
                    value: `-# ${cmd.data.description}`
                }))
            );

        await interaction.update({ embeds: [embed] });
    }
} satisfies SelectMenu;

import { type ChatInputCommandInteraction, inlineCode, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, bold } from 'discord.js';

import type { Command } from '../../structures/command.js';

export default {
    data: {
        name: 'help',
        description: 'Provides an overview of all commands that you\'re able to use.',
    },
    opt: {
        userPermissions: ['SendMessages'],
        botPermissions: ['SendMessages'],
        category: 'General',
        cooldown: 0, // change to 5 when done testing
		favourite: true
    },
    async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		const commands = interaction.client.commands;

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('help-menu')
			.setPlaceholder('Select a category')
			.addOptions([...new Set(commands.map(cmd => cmd.opt?.category))].map(cat => ({
				label: cat || 'Uncategorized',
				value: cat || 'Uncategorized'
			})));

		const row = new ActionRowBuilder<StringSelectMenuBuilder>()
			.addComponents(selectMenu);

		const embed = new EmbedBuilder()
			.setTitle(`Please select a category to view all of the categories commands!`)
			.addFields([
				{
					name: 'Most Used Commands', // we don't actually track the most used lol, maybe later?
					value: commands.filter(cmd => cmd.opt?.favourite).map(cmd => `・ ${bold(cmd.data.name)}\n-# ${cmd.data.description}`).join('\n')
				}
			]);

		await interaction.reply({ embeds: [embed], components: [row] });
    }
} satisfies Command;
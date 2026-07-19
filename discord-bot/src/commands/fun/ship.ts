import { type ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder, AttachmentBuilder } from 'discord.js';

import type { Command } from '../../structures/command.js';
import { generateShipImage } from '../../misc/shipCommand.js';

export default {
	data: {
		name: 'ship',
		description: 'Ship two users and see how well they match.',
		options: [
			{
				name: 'dominant',
				type: ApplicationCommandOptionType.User,
				description: 'Dominant user.',
				required: true
			},
			{
				name: 'submissive',
				type: ApplicationCommandOptionType.User,
				description: 'Submissive user.',
				required: true
			}
		]
	},
	opt: {
		userPermissions: ['SendMessages'],
		botPermissions: ['SendMessages'],
		category: 'Fun',
		cooldown: 5
	},
	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		const dominant = interaction.options.getUser('dominant');
		const submissive = interaction.options.getUser('submissive');

		const ship = Math.floor(Math.random() * 100) + 1;

		const image = await generateShipImage(dominant, submissive, ship);

		const attachment = new AttachmentBuilder(image)
			.setName('ship.png');

		const embed = new EmbedBuilder()
			.setTitle(dominant.displayName.substring(0, Math.floor(dominant.displayName.length / 2)) + submissive.displayName.substring(Math.floor(submissive.displayName.length / 2)))
			.setDescription(`**${dominant.displayName}** and **${submissive.displayName}** match **${ship.toLocaleString()}%**.`)
			.setColor('#ff0000')
			.setImage('attachment://ship.png');

		await interaction.editReply({ embeds: [embed], files: [attachment] });
	}
} satisfies Command;
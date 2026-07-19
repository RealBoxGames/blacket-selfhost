import { type ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import type { Command } from '../../structures/command.js';
import { getUserFromCommand } from '../../misc/userUtil.js';
import { sendUserEmbed } from '../../misc/userCommand.js';
import { ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10.js';

export default {
	data: {
		name: 'user',
		description: 'Get and display information about a user.',
		options: [
			{
				name: 'user',
				type: ApplicationCommandOptionType.String,
				description: 'The user to get information about.',
				autocomplete: true
			}
		],
		integration_types: [
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall
		],
		contexts: [
			InteractionContextType.PrivateChannel,
			InteractionContextType.BotDM,
			InteractionContextType.Guild
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
		try {
			const userLookup = await getUserFromCommand(interaction);
			if (!userLookup) return; // return here because we do error handling and user ux within our util

			await sendUserEmbed(interaction, userLookup);
		} catch (error) {
			console.error(error)
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('❌ Error: User')
						.setDescription(error.message)
						.setColor(0x990000)
						.setThumbnail(`${process.env.VITE_MEDIA_URL}/content/icons/error.png`)
						.setTimestamp()
				]
			});
		}
	}
} satisfies Command;

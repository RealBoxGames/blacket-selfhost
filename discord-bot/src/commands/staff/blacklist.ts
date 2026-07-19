import { EmbedBuilder, type ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } from 'discord.js';

import type { Command } from '../../structures/command.js';

export default {
    data: {
        name: 'blacklist',
        description: 'Blacklist a user from Blacket.',
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: 'reason',
				description: 'The reason for blacklisting the user.',
				required: true
			},
			{
				type: ApplicationCommandOptionType.String,
				name: 'user',
				description: 'The Blacket user to blacklist.'
			},
			{	
				type: ApplicationCommandOptionType.String,
				name: 'ip',
				description: 'The IP to blacklist.'
			}
		]
    },
    opt: {
        userPermissions: ['SendMessages'],
        botPermissions: ['SendMessages'],
        category: 'Staff',
        cooldown: 0
    },
    async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.reply("todo");
    }
} satisfies Command;
import { EmbedBuilder, type ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } from 'discord.js';

import type { Command } from '../../structures/command.js';

export default {
    data: {
        name: 'mute',
        description: 'Mute a user from Blacket.',
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: 'user',
				description: 'The user to mute (either Blacket or Discord, will do both).',
				required: true
			},
			{
				type: ApplicationCommandOptionType.String,
				name: 'reason',
				description: 'The reason for muting the user.',
				required: true
			},
			{
				type: ApplicationCommandOptionType.String,
				name: 'duration',
				description: 'The duration of the user mute (default to perm).'
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
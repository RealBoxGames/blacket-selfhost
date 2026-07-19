import { EmbedBuilder, type ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import type { Command } from '../../structures/command.js';

export default {
    data: {
        name: 'link',
        description: 'Link your Discord and Blacket account.',
    },
    opt: {
        userPermissions: ['SendMessages'],
        botPermissions: ['SendMessages'],
        category: 'Blacket',
        cooldown: 15,
		favourite: true
    },
    async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		const embed = new EmbedBuilder()
			.setTitle('Linking your account')
			.setDescription('Linking your account will allow you to be granted exclusive roles based on your in-game badges, depending on your roles you can also run exclusive commands and more easily let other user\'s view your profile!')
			.setColor(0x2b2d31);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				new ButtonBuilder()
					.setLabel('Link account')
					.setStyle(ButtonStyle.Link)
					.setURL(`https://discord.com/oauth2/authorize?client_id=${process.env.BOT_CLIENT_ID}&response_type=code&redirect_uri=${process.env.SERVER_BASE_URL}/settings/link-discord&scope=identify`)
			);

		await interaction.reply({ embeds: [embed], components: [row] });
    }
} satisfies Command;
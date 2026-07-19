import { EmbedBuilder, type ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType, userMention, inlineCode } from 'discord.js';

import type { Command } from '../../structures/command.js';
import parseDuration from 'parse-duration';
import { PermissionType, PunishmentType } from '@blacket/core';
import { getUserFromCommand, resolveDiscordUserToBlacketId } from '../../misc/userUtil.js';
import { resolveUserPermissions } from '../../misc/util.js';

export default {
    data: {
        name: 'ban',
        description: 'Ban a user from Blacket.',
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: 'user',
				description: 'The user to ban (either Blacket or Discord, will do both).',
				required: true
			},
			{
				type: ApplicationCommandOptionType.String,
				name: 'reason',
				description: 'The reason for banning the user.',
				required: true
			},
			{
				type: ApplicationCommandOptionType.String,
				name: 'duration',
				description: 'The duration of the user ban (default to perm).'
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
		await interaction.deferReply();

		const staffBlacketUserId = await resolveDiscordUserToBlacketId(interaction, interaction.user);
		if (!staffBlacketUserId) return;

		const staffPermissions = await resolveUserPermissions(interaction, staffBlacketUserId);

		if (!staffPermissions.includes(PermissionType.BAN_USERS)) {
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Error')
						.setDescription('You do not have permission to ban users.')
						.setColor(0x990000)
				]
			});
			return;
		}

		const userResolvable = interaction.options.getString('user', true);
		const reason = interaction.options.getString('reason', true);
		const durationResolvable = interaction.options.getString('duration');

		const blacketUserId = await getUserFromCommand(interaction);

		const duration = durationResolvable ? new Date(Date.now() + parseDuration(durationResolvable)) : new Date(0);

		// we ban the user from Blacket no matter what
		// since our resolver will match for Blacket user id first
		if (blacketUserId) {
			await interaction.client.prisma.punishment.create({
				data: {
					type: PunishmentType.BAN,
					user: {
						connect: {
							id: blacketUserId
						}
					},
					staff: {
						connect: {
							id: staffBlacketUserId
						}
					},
					reason: reason,
					expiresAt: duration
				}
			})
		}

		// if the provided user is a discord user, we ban them from discord without even checking for linked user
		// this is just for if a staff is only banning from discord
		if (userResolvable.match(/<?@?!?(\d{17,19})>?/)) {
			const discordUserId = userResolvable.match(/<?@?!?(\d{17,19})>?/)[1];
			const discordUser = await interaction.guild.members.fetch(discordUserId);
			await discordUser.ban({ reason: reason});
		} else if (blacketUserId) {
			// now we check if the Blacket user is linked to a discord user
			// if so, we ban them from discord
			var discordUserLinked = await interaction.client.prisma.userDiscord.findFirst({
				where: {
					userId: blacketUserId
				}
			});

			if (discordUserLinked) {
				try {
					const discordUser = await interaction.guild.members.fetch(discordUserLinked.discordId);
					if (discordUser) await discordUser.ban({ reason: reason,  });
				} catch {}
			}
		}


		const embed = new EmbedBuilder()
			.setTitle('Ban')
			.setDescription(`Banned ${inlineCode(userResolvable)} ${discordUserLinked ? `(${userMention(discordUserLinked.discordId)})` : ""} until ${!durationResolvable ? inlineCode('perm') : `<t:${Math.floor(duration.getTime()/1000)}:D>`} with reason: ${inlineCode(reason)}`)
			.setColor(0x990000);

		await interaction.editReply({ embeds: [embed] });
    }
} satisfies Command;

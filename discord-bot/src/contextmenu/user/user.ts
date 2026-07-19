import { ApplicationCommandType, type UserContextMenuCommandInteraction } from 'discord.js';
import { ContextMenu } from '../../structures/contextMenu';
import { getUserFromContextMenu } from '../../misc/userUtil';
import { sendUserEmbed } from '../../misc/userCommand';

export default {
    data: {
        type: ApplicationCommandType.User,
        name: 'View Blacket User',
    },
    async execute(interaction: UserContextMenuCommandInteraction<'cached'>) {
        const userLookup = await getUserFromContextMenu(interaction);
        if (!userLookup) return; // return here because we do error handling and user ux within our util

		await sendUserEmbed(interaction, userLookup)
    }
} satisfies ContextMenu;
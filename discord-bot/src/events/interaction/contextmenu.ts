import { Events, inlineCode, MessageFlags } from 'discord.js';

import type { Event } from '../../structures/event.js';
import simpleEmbedMaker, { SemType } from '../../misc/simpleEmbedMaker.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isContextMenuCommand()) return;

        const contextMenu = interaction.client.contextMenus.get(interaction.commandName);

        if (!contextMenu?.data) {
            console.error(`No context menu matching ${interaction.commandName} was found.`);
            await interaction.reply({
                embeds: [
                    simpleEmbedMaker({
                        type: SemType.ERROR,
                        title: 'No command',
                        description: `There is no context menu matching ${inlineCode(interaction.commandName)}!`
                    })
                ],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        };

        try {
            await contextMenu.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    embeds: [
                        simpleEmbedMaker({
                            type: SemType.ERROR,
                            title: 'Unknown',
                            description: `There was an error while executing this context menu: \n${error.message} \nCheck the console for more info.`
                        })
                    ],
                    flags: [MessageFlags.Ephemeral]
                });
            } else {
                await interaction.reply({
                    embeds: [
                        simpleEmbedMaker({
                            type: SemType.ERROR,
                            title: 'Unknown',
                            description: `There was an error while executing this context menu: \n${error.message} \nCheck the console for more info.`
                        })
                    ],
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }
    }
} satisfies Event<Events.InteractionCreate>;

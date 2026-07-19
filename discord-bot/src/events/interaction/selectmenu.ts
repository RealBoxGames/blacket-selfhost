import { Events, inlineCode, MessageFlags } from 'discord.js';

import type { Event } from '../../structures/event.js';
import simpleEmbedMaker, { SemType } from '../../misc/simpleEmbedMaker.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isAnySelectMenu()) return;
        if (!interaction.inCachedGuild()) return;

        const contextMenu = interaction.client.selectMenus.get(interaction.customId);

        if (!contextMenu?.data) {
            console.error(`No select menu matching ${interaction.customId} was found.`);
            await interaction.reply({
                embeds: [
                    simpleEmbedMaker({
                        type: SemType.ERROR,
                        title: 'No Select Menu Found',
                        description: `There is no select menu matching ${inlineCode(interaction.customId)}!`
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
                            description: `There was an error while executing this select menu: \n${error.message} \nCheck the console for more info.`
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
                            description: `There was an error while executing this select menu: \n${error.message} \nCheck the console for more info.`
                        })
                    ],
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }
    }
} satisfies Event<Events.InteractionCreate>;

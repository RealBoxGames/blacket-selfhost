import { Events, inlineCode, Collection, bold, CommandInteraction, CacheType, MessageFlags } from 'discord.js';

import { missingPerms } from '../../misc/util.js';

import type { Event } from '../../structures/event.js';
import simpleEmbedMaker, { SemType } from '../../misc/simpleEmbedMaker.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command?.data) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            await interaction.reply({
                embeds: [
                    simpleEmbedMaker({
                        type: SemType.ERROR,
                        title: 'No command',
                        description: `There is no command matching ${inlineCode(interaction.commandName)}!`
                    })
                ],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        };

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    embeds: [
                        simpleEmbedMaker({
                            type: SemType.ERROR,
                            title: 'Unknown',
                            description: `There was an error while executing this command: \n${error.message} \nCheck the console for more info.`
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
                            description: `There was an error while executing this command: \n${error.message} \nCheck the console for more info.`
                        })
                    ],
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }
    }
} satisfies Event<Events.InteractionCreate>;

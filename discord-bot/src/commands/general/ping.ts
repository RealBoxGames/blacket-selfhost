import { type ChatInputCommandInteraction, inlineCode, MessageFlags } from 'discord.js';

import type { Command } from '../../structures/command.js';
import SimpleEmbedMaker, { SemType } from '../../misc/simpleEmbedMaker.js';

export default {
    data: {
        name: 'ping',
        description: 'Get the bot\'s latency.',
    },
    opt: {
        userPermissions: ['SendMessages'],
        botPermissions: ['SendMessages'],
        category: 'General',
        cooldown: 5
    },
    async execute(interaction: ChatInputCommandInteraction<'cached'>) {
        if (interaction.client.ws.ping == -1) {
            await interaction.reply({
                embeds: [
                    SimpleEmbedMaker({
                        type: SemType.ERROR,
                        title: "Invalid WebSocket Ping",
                        description: "Please wait a bit after the bot has just started to get accurate websocket ping!"
                    })
                ],
                flags: [MessageFlags.Ephemeral]
            })
            return;
        }

        const msg = await interaction.reply({
            content: '🏓 Pinging...',
            fetchReply: true
        });

        const ping = msg.createdTimestamp - interaction.createdTimestamp;

        await interaction.editReply({
            content: null,
            embeds: [
                SimpleEmbedMaker({
                    type: SemType.INFO,
                    title: "🏓 Pong",
                    description: `Roundtrip Latency is ${inlineCode(`${ping}ms`)}.
                    Websocket Heartbeat is ${inlineCode(`${interaction.client.ws.ping}ms`)}.`,
                })
            ]
        })
    }
} satisfies Command;

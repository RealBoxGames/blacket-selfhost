import { EmbedBuilder, type ChatInputCommandInteraction, ApplicationCommandOptionType, parseEmoji, MessageFlags } from 'discord.js';

import type { Command } from '../../structures/command.js';
import Emojis from '../../misc/emojis.js';

const tokens = async (interaction) => {
    const tokenStats = await interaction.client.prisma.user.aggregate({
        _sum: {
            tokens: true
        },
        _avg: {
            tokens: true
        },
        where: {
            tokens: {
                gt: 0
            }
        }
    });

    const topUsers = await interaction.client.prisma.user.findMany({
        where: {
            tokens: {
                gt: 0
            }
        },
        select: {
            username: true,
            tokens: true
        },
        orderBy: {
            tokens: 'desc'
        },
        take: 10
    });

    const sortedTopUsers = topUsers.sort((a, b) => b.tokens - a.tokens).map((user, index) => {
        return `${index + 1}. **${user ? user.username : 'Unknown User'}** - \`\`${user.tokens.toLocaleString()}\`\``;
    });

    const embed = new EmbedBuilder()
        .setTitle("Leaderboard - Tokens")
        .setColor(0xf5ec42)
        .setDescription(`${Emojis.Token} **Total Tokens:** \`\`${tokenStats._sum.tokens ? tokenStats._sum.tokens.toLocaleString() : 0}\`\`\n${Emojis.Token} **Average User Tokens:** \`\`${tokenStats._avg.tokens ? Math.round(tokenStats._avg.tokens).toLocaleString() : 0}\`\`\n\n** **`)
        .setThumbnail(`https://cdn.discordapp.com/emojis/${parseEmoji(Emojis.Token).id}.png`)
        .addFields({
            name: '__``Top 10 Users``__',
            value: sortedTopUsers.length > 0
                ? sortedTopUsers
                    .slice(0, 5)
                    .join('\n')
                : 'No users have any tokens.',
            inline: true
        });

    if (sortedTopUsers.length > 5) embed.addFields({
        name: '** **',
        value: sortedTopUsers.slice(5).join('\n'),
        inline: true
    });

    await interaction.reply({
        embeds: [embed]
    });
}

const experience = async (interaction) => {
    const expStats = await interaction.client.prisma.user.aggregate({
        _sum: {
            experience: true
        },
        _avg: {
            experience: true
        },
        where: {
            experience: {
                gt: 0
            }
        }
    });

    const topUsers = await interaction.client.prisma.user.findMany({
        where: {
            experience: {
                gt: 0
            }
        },
        select: {
            username: true,
            experience: true
        },
        orderBy: {
            experience: 'desc'
        },
        take: 10
    });

    const sortedTopUsers = topUsers.sort((a, b) => b.experience - a.experience).map((user, index) => {
        return `${index + 1}. **${user ? user.username : 'Unknown User'}** - \`\`${user.experience.toLocaleString()}\`\``;
    });

    const embed = new EmbedBuilder()
        .setTitle("Leaderboard - Experience")
        .setColor(0x81fc91)
        .setDescription(`${Emojis.Experience} **Total Experience:** \`\`${expStats._sum.experience ? expStats._sum.experience.toLocaleString() : 0}\`\`\n${Emojis.Experience} **Average User Experience:** \`\`${expStats._avg.experience ? Math.round(expStats._avg.experience).toLocaleString() : 0}\`\`\n\n** **`)
        .setThumbnail(`https://cdn.discordapp.com/emojis/${parseEmoji(Emojis.Experience).id}.png`)
        .addFields({
            name: '__``Top 10 Users``__',
            value: sortedTopUsers.length > 0
                ? sortedTopUsers
                    .slice(0, 5)
                    .join('\n')
                : 'No users have any experience.',
            inline: true
        });

    if (sortedTopUsers.length > 5) embed.addFields({
        name: '** **',
        value: sortedTopUsers.slice(5).join('\n'),
        inline: true
    });

    await interaction.reply({
        embeds: [embed]
    });
}
const messages = async (interaction) => {
    // todo: fix, does not work currently.

    const [totalMessages, totalUsers] = await Promise.all([
        interaction.client.prisma.message.count(),
        interaction.client.prisma.user.count()
    ]);

    const averageMessagesPerUser = totalUsers > 0 ? totalMessages / totalUsers : 0;

    const topUserCounts = await interaction.client.prisma.message.groupBy({
        by: ['authorId'],
        _count: {
            id: true
        },
        orderBy: {
            _count: {
                id: 'desc'
            }
        },
        take: 10
    });

    const userIds = topUserCounts.map(item => item.authorId);
    const users = await interaction.client.prisma.user.findMany({
        where: {
            id: {
                in: userIds
            }
        },
        select: {
            id: true,
            username: true
        }
    });

    const topUsers = topUserCounts.map(count => {
        const user = users.find(u => u.id === count.authorId);
        return {
            id: count.authorId,
            username: user?.username,
            messageCount: count._count.id
        };
    });

    const sortedTopUsers = topUsers.sort((a, b) => b.messages - a.messages).map((user, index) => {
        console.log(user);
        return `${index + 1}. **${user ? user.username : 'Unknown User'}** - \`\`${user.messageCount.toLocaleString()}\`\``;
    });

    const embed = new EmbedBuilder()
        .setTitle("Leaderboard - Messages")
        .setColor(0x42f5ec)
        .setDescription(`${Emojis.Messages} **Total Messages:** \`\`${totalMessages ? totalMessages.toLocaleString() : 0}\`\`\n${Emojis.Messages} **Average User Messages:** \`\`${averageMessagesPerUser ? Math.round(averageMessagesPerUser).toLocaleString() : 0}\`\`\n\n** **`)
        .setThumbnail(`https://cdn.discordapp.com/emojis/${parseEmoji(Emojis.Messages).id}.png`)
        .addFields({
            name: '__``Top 10 Users``__',
            value: sortedTopUsers.length > 0
                ? sortedTopUsers
                    .slice(0, 5)
                    .join('\n')
                : 'No users have any messages.',
            inline: true
        });

    if (sortedTopUsers.length > 5) embed.addFields({
        name: '** **',
        value: sortedTopUsers.slice(5).join('\n'),
        inline: true
    });

    await interaction.reply({
        embeds: [embed]
    });
}

export default {
    data: {
        name: 'leaderboard',
        description: 'View leaderboard information.',
        options: [
            {
                name: 'tokens',
                description: 'View the leaderboard for tokens.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'experience',
                description: 'View the leaderboard for experience.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'messages',
                description: 'View the leaderboard for messages.',
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    opt: {
        userPermissions: ['SendMessages'],
        botPermissions: ['SendMessages'],
        category: 'Blacket',
        cooldown: 5
    },
    async execute(interaction: ChatInputCommandInteraction<'cached'>) {
        switch (interaction.options.getSubcommand()) {
            case 'tokens':
                await tokens(interaction);
                break;
            case 'experience':
                await experience(interaction);
                break;
            case 'messages':
                await messages(interaction);
                break;
            default:
                await interaction.reply({
                    content: 'Invalid subcommand. Please use `/leaderboard tokens`, `/leaderboard experience`, or `/leaderboard messages`.',
                    flags: [MessageFlags.Ephemeral]
                });
                break;
        }

    }
} satisfies Command;

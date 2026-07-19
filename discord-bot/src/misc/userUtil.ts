import { ChatInputCommandInteraction, MessageFlags, UserContextMenuCommandInteraction, inlineCode, userMention } from "discord.js"
import { User as DiscordUser } from "discord.js";
import SimpleEmbedMaker, { SemType } from './simpleEmbedMaker.js';

// easy fetchers from command - 🦘

export async function getUserFromCommand(interaction: ChatInputCommandInteraction<'cached'>) {
    const userResolvable = interaction.options.getString('user');

    try {
        // if no arg is supplied, we return the user who sent the command
        if (!userResolvable) return await resolveDiscordUserToBlacketId(interaction, interaction.user);

        // assuming the resolvable is a discord user id or mention, we attempt to resolve it
        const discordUserResolvable = await resolveDiscordUserResolvableToDiscordUserId(userResolvable);

        const discordUser = await interaction.client.users.fetch(discordUserResolvable).catch(() => null) as DiscordUser | null;
        if (discordUser) return await resolveDiscordUserToBlacketId(interaction, discordUser);

        // if the resolvable is a number, we assume it's a Blacket user id
        if (userResolvable.match(/^\d{17,19}$/)) return userResolvable;

        // if the resolvable is a string, we finally assume it's a Blacket username
        return await resolveBlacketUsernameToBlacketId(interaction, userResolvable);
    } catch (error) {
        if (error instanceof Error) {
            await interactionReplyError(interaction, error);
            return false;
        }
        else throw error;
    }
}

export async function getUserFromContextMenu(interaction: UserContextMenuCommandInteraction<'cached'>) {
    try {
        return await resolveDiscordUserToBlacketId(interaction, interaction.targetUser);
    } catch (error) {
        if (error instanceof Error) {
            await interactionReplyError(interaction, error);
            return false;
        }
        else throw error;
    }
}

// throwing util
async function interactionReplyError(interaction: ChatInputCommandInteraction<'cached'> | UserContextMenuCommandInteraction<'cached'>, error: Error) {
    await interaction.reply({
        embeds: [
            SimpleEmbedMaker({
                type: SemType.ERROR,
                title: 'User not found',
                description: error.message
            })
        ],
        flags: [MessageFlags.Ephemeral]
    });
}

// resolvers

async function resolveDiscordUserResolvableToDiscordUserId(discordUserResolvable: string): Promise<string> {
    const discordUserResolvableMatch = discordUserResolvable.match(/<?@?!?(\d{17,19})>?/);
    if (discordUserResolvableMatch) return discordUserResolvableMatch[1];
    else return discordUserResolvable;
}

async function resolveBlacketUsernameToBlacketId(interaction: ChatInputCommandInteraction<'cached'> | UserContextMenuCommandInteraction<'cached'>, usernameToResolve: string): Promise<string> {
    const user = await interaction.client.prisma.user.findFirst({
        where: {
            username: usernameToResolve
        },
        select: {
            id: true
        }
    });

    if (!user) throw new Error(`No Blacket user found for username ${inlineCode(usernameToResolve)}!`);

    return user.id;
}

export async function resolveDiscordUserToBlacketId(interaction: ChatInputCommandInteraction<'cached'> | UserContextMenuCommandInteraction<'cached'>, discordUser: DiscordUser): Promise<string> {
    const userDiscordResolved = await interaction.client.prisma.userDiscord.findFirst({
        where: {
            discordId: discordUser.id
        },
        select: {
            userId: true
        }
    });

    if (!userDiscordResolved) throw new Error(`No linked Blacket user for ${userMention(discordUser.id)}!`);

    return userDiscordResolved.userId;
}

export async function getDbUser(interaction: ChatInputCommandInteraction<'cached'> | UserContextMenuCommandInteraction<'cached'>, userLookup: any) {
    const user = await interaction.client.prisma.user.findFirst({
        where: {
            id: userLookup
        },
        include: {
            groups: {
                include: {
                    group: {
                        include: {
                            image: true
                        }
                    }
                }
            },
            avatar: true,
            banner: true,
            title: true,
            discord: true,
            statistics: true,
            blooks: true
        }
    });

    return user;
}

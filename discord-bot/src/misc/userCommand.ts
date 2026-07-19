import { AttachmentBuilder, EmbedBuilder, TimestampStyles, time, userMention, ActionRowBuilder, ButtonBuilder, ButtonStyle, inlineCode, parseEmoji, MessageFlags } from 'discord.js';

import SimpleEmbedMaker, { SemType } from './simpleEmbedMaker.js';
import { getDbUser } from './userUtil.js';

import Canvas from '@napi-rs/canvas';
import { experienceToLevel, levelToExperience } from './util.js';
import Emojis from './emojis.js';

async function renderRectangleRounded(ctx: Canvas.SKRSContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
}

async function renderBadge(ctx: Canvas.SKRSContext2D, scale: number, color: string, i: number, badges: string[], badgeContainersPerRow: number, badgeContainerSize: number, badgeContainerPadding: number, badgeSize: number) {
    const xBadge = 10 * scale + (i % badgeContainersPerRow) * badgeContainerSize;
    const yBadge = (138 + 20) * scale + Math.floor(i / badgeContainersPerRow) * badgeContainerSize;

    const x = xBadge - badgeContainerPadding;
    const y = yBadge - badgeContainerPadding;
    const width = badgeSize + badgeContainerPadding * 2;
    const height = badgeSize + badgeContainerPadding * 2;
    const radius = 10 * scale;

    await renderRectangleRounded(ctx, x, y, width, height, radius, color);

    const badge = await Canvas.loadImage(badges[i]);
    ctx.drawImage(badge, xBadge, yBadge, badgeSize, badgeSize);
}

/***
 * TODO:
 * - Add custom avatar and banner support
 * - Add colour support
*/
export async function sendUserEmbed(interaction: any, userLookup: any) {
    const user = await getDbUser(interaction, userLookup);

    if (!user) {
        await interaction.reply({
            embeds: [
                SimpleEmbedMaker({
                    type: SemType.ERROR,
                    title: 'User not found',
                    description: `No user found for username/id of ${inlineCode(userLookup)}!`
                })
            ],
            flags: [MessageFlags.Ephemeral]
        });
        return;
    }


    /**
     * Constants
    */
    const scale = 1;
    const primaryColor = '#1f1f1f';
    const levelFilledColor = '#00bfff';

    const userLevel = experienceToLevel(user.experience);
    const experienceUntilNextLevel = levelToExperience(Math.floor(userLevel) + 1) - user.experience;

    const badgeContainersPerRow = 8;
    const badgeContainerSize = 63 * scale;
    const badgeContainerPadding = 10 * scale;
    const badgeSize = 32 * scale;

    const levelBarWidth = 345 * scale;
    const levelBarHeight = 18 * scale;
    const levelBarRadius = 10 * scale;
    const completedLevelWidth = levelBarWidth * (userLevel % 2);


    /**
     * Get user groups and sort them by priority
     * Then get the badge image paths and assign them to a variable
     */
    let groups = user.groups.map(group => group.group);
    groups = groups.sort((a, b) => b.priority - a.priority);
    groups = groups.filter(group => group.image && group.image.path);
    const badges = groups.map(group => group.image.path.replace('{cdn}', process.env.VITE_MEDIA_URL));

    const badgeHolderContainerSize = Math.ceil(badges.length / badgeContainersPerRow) * badgeContainerSize;

    // TODO: make this work with the new avatar system
    const userAvatar = await Canvas.loadImage("https://blacket.org/content/logo.webp");
    // const userAvatar = await Canvas.loadImage(user.avatar.path.replace('{cdn}', process.env.VITE_MEDIA_URL));

    const userAvatarAdjustedX = (userAvatar.naturalWidth / userAvatar.naturalHeight) * 128;

    const sizeX = (382 + userAvatarAdjustedX) * scale;
    const sizeY = (138 * scale) + badgeHolderContainerSize;


    /**
     * Create canvas and context
     */
    const canvas = Canvas.createCanvas(sizeX, sizeY);
    const ctx = canvas.getContext('2d');

    /**
     * Render user header
    */
    ctx.drawImage(userAvatar, 0, 0, userAvatarAdjustedX * scale, 128 * scale);

    // TODO: make this work with the new banner system
    const userBanner = await Canvas.loadImage("https://blacket.org/content/banners/Default.webp");
    // const userBanner = await Canvas.loadImage(user.banner.path.replace('{cdn}', process.env.VITE_MEDIA_URL));
    ctx.drawImage(userBanner, (21 + userAvatarAdjustedX) * scale, 18.6 * scale, 361.29 * scale, 80 * scale);


    /**
     * Render badges
     */
    for (let i = 0; i < badges.length; i++) {
        await renderBadge(ctx, scale, primaryColor, i, badges, badgeContainersPerRow, badgeContainerSize, badgeContainerPadding, badgeSize);
    }

    const levelBarX = (36.17 + userAvatarAdjustedX) * scale;
    const levelBarY = 112 * scale;


    /**
     * Render level bar
     */
    await renderRectangleRounded(ctx, levelBarX, levelBarY, levelBarWidth, levelBarHeight, levelBarRadius, primaryColor);
    await renderRectangleRounded(ctx, levelBarX, levelBarY, completedLevelWidth, levelBarHeight, levelBarRadius, levelFilledColor);


    /**
     * Render level star
     */
    const levelStar = await Canvas.loadImage(process.env.VITE_MEDIA_URL + "/content/level.png");
    ctx.drawImage(levelStar, (15 + userAvatarAdjustedX) * scale, 103 * scale, 35 * scale, 35 * scale);


    /**
     * Render text
     *  - Level
     *  - Username
     *  - Role
    */
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    ctx.font = `${20 * scale}px Titan One`;
    ctx.fillText(Math.floor(userLevel).toString(), (33.67 + userAvatarAdjustedX) * scale, 127 * scale);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeText(Math.floor(userLevel).toString(), (33.67 + userAvatarAdjustedX) * scale, 127 * scale);

    ctx.shadowColor = '#000000';
    ctx.shadowOffsetX = 2 * scale;
    ctx.shadowOffsetY = 2 * scale;
    ctx.shadowBlur = 1;
    ctx.font = `${32 * scale}px Nunito`;
    ctx.fillText(user.username, (201.645 + userAvatarAdjustedX) * scale, 55.6 * scale);

    ctx.font = `${16 * scale}px Nunito`;
    ctx.fillText(user.title.name, (201.645 + userAvatarAdjustedX) * scale, 78.6 * scale);

    const unlockCount = new Set(user.blooks.map(blook => blook.blookId)).size;

    /**
     * Send embed
    */
    const userHeaderAttachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'user.png' });

    const userIdEmojiId = parseEmoji(Emojis.UserID).id;

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x2b2d31)
                .setImage('attachment://user.png'),
            new EmbedBuilder()
                .setColor(0x2b2d31)
                .setFields([
                    {
                        name: '__``Stats``__',
                        value: `${Emojis.Token} **Tokens:** ${user.tokens.toLocaleString()}` +
                            `\n${Emojis.Level} **Level:** ${Math.floor(userLevel)}` +
                            `\n${Emojis.Experience} **XP:** ${user.experience.toLocaleString()}` +
                            `\n${Emojis.Experience} **XP to next:** ${Math.round(experienceUntilNextLevel).toLocaleString()}`,

                        inline: true
                    },
                    {
                        name: '‎ ',
                        value: `\n${Emojis.PacksOpened} **Packs Opened:** ${user.statistics.packsOpened.toLocaleString()}` +
                            `\n${Emojis.Messages} **Messages:** ${user.statistics.messagesSent.toLocaleString()}` +
                            `\n${Emojis.Unlocked} **Unlocked:** ${unlockCount.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '__``User Info``__',
                        value: "**Discord:** " + (user.discord ? userMention(user.discord.discordId) : "N/A") +
                            "\n**Joined:** " + time(user.createdAt, TimestampStyles.ShortDate) +
                            "\n**Last Seen:** " + time(user.updatedAt, TimestampStyles.RelativeTime),
                        inline: true
                    },
                    // {
                    // 	name: '__``Punishments``__',
                    // 	value: "**Banned:** " + "No" +
                    // 		"\n**Muted:** " + "No",
                    // 	inline: true
                    // },
                ])
                .setFooter({ iconURL: `https://cdn.discordapp.com/emojis/${userIdEmojiId}.png`, text: `ID: ${user.id}  •  Clan: None` })
                .setImage('https://i.imgur.com/8NdaHgw.png')
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('View Profile')
                        .setURL(`${process.env.SERVER_BASE_URL}/stats?name=${user.id}`)
                        .setStyle(ButtonStyle.Link),
                    new ButtonBuilder()
                        .setLabel('View Clan')
                        .setURL(`${process.env.SERVER_BASE_URL}/stats?name=${user.id}`)
                        .setStyle(ButtonStyle.Link),
                    // new ButtonBuilder()
                    // 	.setLabel('Manage User')
                    // 	.setStyle(ButtonStyle.Danger)
                    // 	.setCustomId('manageUser')
                    // 	.setEmoji('🛠')
                ),
        ],
        files: [userHeaderAttachment],
    });
}

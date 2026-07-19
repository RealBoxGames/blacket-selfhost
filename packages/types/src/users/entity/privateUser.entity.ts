import { Exclude } from "class-transformer";
import type { UserBlook, UserItem, UserStatistic, UserDiscord, UserPaymentMethod, Group, PermissionType, UserGuild, UserTitle, UserBanner, UserFont, Upload, IpAddress, Room, UserSubscription, UserWebAuthn } from "../../interfaces";
import { UserSettings, PublicUserSubscription } from "./interface";

export class PrivateUser {
    id: string;
    username: string;
    email?: string;
    emailVerified: boolean;

    @Exclude()
    password: string = undefined;

    @Exclude()
    groups: Group[];

    @Exclude()
    avatarId: number = undefined;

    @Exclude()
    customAvatarId: number = undefined;

    @Exclude()
    customBannerId: number = undefined;

    @Exclude()
    reputation: number = undefined;

    @Exclude()
    discordId: string = undefined;

    @Exclude()
    stripeCustomerId: string = undefined;

    @Exclude()
    ipAddressId: number = undefined;

    @Exclude()
    ipAddress: IpAddress = undefined;

    avatar?: UserBlook;

    bannerId?: number;

    customAvatar?: Upload;
    customBanner?: Upload;

    titleId: number;
    fontId: number;

    titles: number[] | UserTitle[] = [];
    fonts: number[] | UserFont[] = [];
    banners: number[] | UserBanner[] = [];
    badges: Group[];

    color: string;

    tokens: number;
    diamonds: number;
    experience: number;

    permissions: PermissionType[];

    isSystem: boolean = false;
    isAi: boolean = false;

    lastClaimed: Date;

    lastSeen: Date;

    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;

    readRulesAt: Date;

    blooks: UserBlook[] = [];
    items: UserItem[] = [];

    settings: UserSettings;

    authMethods: UserWebAuthn[];

    paymentMethods: UserPaymentMethod[];

    subscriptions: UserSubscription[] = [];

    crystals: number;

    guild: UserGuild[];

    rooms: Room[];

    statistics: UserStatistic;

    discord?: UserDiscord;

    constructor(partial: Partial<PrivateUser>) {
        Object.assign(this, partial);

        this.password = undefined;
        this.avatarId = undefined;
        this.customAvatarId = undefined;
        this.customBannerId = undefined;
        this.stripeCustomerId = undefined;
        this.ipAddressId = undefined;
        this.ipAddress = undefined;

        this.customAvatar = (this.customAvatar as Upload) ?? null;
        this.customBanner = (this.customBanner as Upload) ?? null;

        this.reputation = undefined;

        this.titles = (this.titles as UserTitle[]).map((title) => title.titleId);
        this.fonts = (this.fonts as UserFont[]).map((font) => font.fontId);
        this.banners = (this.banners as UserBanner[]).map((banner) => banner.bannerId);

        if (this.paymentMethods) this.paymentMethods = this.paymentMethods.map((method) => ({ ...method, userId: undefined }));
        if (!this.deletedAt) this.deletedAt = undefined;

        this.badges = [];

        // sorts permissions including group permissions
        if (this.groups) this.badges = this.groups.reduce((acc, group) => [...acc, group], [])
            .filter((badge) => badge.imageId !== null);
        // if (this.subscriptions) this.badges = [
        //     ...this.badges,
        //     ...this.subscriptions.reduce((acc, subscription) => {
        //         if (subscription?.product?.group?.imageId !== null) {
        //             return [
        //                 ...acc,
        //                 {
        //                     ...subscription?.product?.group,
        //                     permissions: undefined,
        //                     deletedAt: undefined,
        //                     discordRoleId: undefined
        //                 }
        //             ]
        //         }
        //         return acc;
        //     }, [])
        // ];
        if (this.permissions && this.groups) this.permissions = [...new Set([
            ...this.permissions,
            ...this.groups.reduce((acc, group) => [...acc, ...group.permissions], [])
        ])];

        if (this.groups) this.groups = undefined;

        if (this.settings) this.settings.otpEnabled = this.settings.otpSecret ? true : false;
        if (this.settings) this.settings.otpSecret = undefined;
    }
}

export class StaffUserGroupEntity {
    id: number;
    name: string;
    priority: number;

    constructor(partial: Partial<StaffUserGroupEntity>) {
        Object.assign(this, partial);
    }
}

export class StaffUserEntity {
    id: string;
    username: string;
    tokens: number;
    diamonds: number;
    crystals: number;
    avatarBlookId: number | null;
    avatarShiny: boolean;
    groups: StaffUserGroupEntity[];
    createdAt: Date;

    constructor(partial: Partial<StaffUserEntity>) {
        Object.assign(this, partial);
    }
}

export default StaffUserEntity;

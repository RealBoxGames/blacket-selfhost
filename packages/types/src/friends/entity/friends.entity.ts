import { PublicUser } from "../../users";

export class FriendsFriendsEntity {
    friends: PublicUser[];
    friendedBy: PublicUser[]
    blocked: PublicUser[];

    constructor(partial: Partial<FriendsFriendsEntity>) {
        Object.assign(this, partial);
    }
}


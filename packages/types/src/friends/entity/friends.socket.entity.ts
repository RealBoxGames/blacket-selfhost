import { PublicUser } from "../../users";

export class SocketFriendsEntity extends PublicUser {
    constructor(partial: Partial<SocketFriendsEntity>) {
        super(partial);
    }
}


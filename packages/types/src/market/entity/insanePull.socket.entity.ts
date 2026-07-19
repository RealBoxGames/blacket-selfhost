export class SocketMarketInsanePullEntity {
    userId: string;
    videoId: number;

    constructor(partial: Partial<SocketMarketInsanePullEntity>) {
        Object.assign(this, partial);
    }
}


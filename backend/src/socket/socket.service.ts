import { Injectable } from "@nestjs/common";
import { CoreService } from "src/core/core.service";
import { RedisService } from "src/redis/redis.service";
import { Server, Socket } from "socket.io";
import {
    BrenderEntity,
    BrenderPlayerEntity,
    BrenderTradingTableEntity,
    PublicUser,
    SocketAuctionBidEntity,
    SocketAuctionExpireEntity,
    SocketFriendsEntity,
    SocketMarketInsanePullEntity,
    SocketMessageType,
    SocketPaymentMethodEntity,
    SocketTradingPlazaMoveDto
} from "@blacket/types";
import { Room } from "@blacket/core";

type RoomWithUsers = Room & { users: { id: string }[] };
type TradingPlazaPlayer = BrenderPlayerEntity & { movedAt: number };

const PlazaMinX = -2500;
const PlazaMaxX = 2500;
const PlazaMinY = -2500;
const PlazaMaxY = 2500;
const PlazaMaxSpeed = 1500;
const PlazaMoveGrace = 150;
const MaxMoveSecs = 0.5;

@Injectable()
export class SocketService {
    public server: Server;

    public tradingPlazaEntities: {
        generic: BrenderEntity[];
        player: TradingPlazaPlayer[];
        tradingTable: BrenderTradingTableEntity[];
    };

    constructor(private readonly coreService: CoreService,
        private readonly redisService: RedisService,) {
        this.tradingPlazaEntities = {
            generic: [],
            player: [],
            tradingTable: []
        };
    }

    private validatePlazaMove(player: TradingPlazaPlayer, data: SocketTradingPlazaMoveDto,): boolean {
        if (!data || typeof data !== "object" || Array.isArray(data)) return false;
        if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return false;
        if (data.x < PlazaMinX || data.x > PlazaMaxX) return false;
        if (data.y < PlazaMinY || data.y > PlazaMaxY) return false;

        const now = Date.now();
        const elapsed = Math.min(Math.max((now - player.movedAt) / 1000, 1 / 20), MaxMoveSecs);
        const maxDist = PlazaMaxSpeed * elapsed + PlazaMoveGrace;
        const dist = Math.hypot(data.x - player.x, data.y - player.y);

        return dist <= maxDist;
    }

    emitMessageAndCloseSocket(socket: Socket, event: string, data: any) {
        socket.emit(event, data);

        socket.disconnect();
    }

    async verifyConnection(client: Socket) {
        const token = client.handshake.auth.token as string | null;
        if (!token) return this.emitMessageAndCloseSocket(client, SocketMessageType.UNAUTHORIZED, { message: "no token provided" },);

        const decodedToken = this.coreService.safelyParseJSON(Buffer.from(token, "base64").toString(),);
        if (!decodedToken) return this.emitMessageAndCloseSocket(client, SocketMessageType.UNAUTHORIZED, { message: "invalid token" },);

        const session = await this.redisService.getSession(decodedToken.userId);
        if (!session) return this.emitMessageAndCloseSocket(client, SocketMessageType.UNAUTHORIZED, { message: "invalid session" },);

        if (decodedToken.id !== session.id) return this.emitMessageAndCloseSocket(client, SocketMessageType.UNAUTHORIZED, { message: "token mismatch" },);

        client.session = session;
        client.ping = 0;

        client.inRoom = (room: string) => client.rooms.has(room);

        client.join(`user-${session.userId}`);

        return client.send(SocketMessageType.AUTHORIZED, {
            userId: client.session.userId
        });
    }

    getAllConnectedUsers() {
        return [
            ...new Set(Object.keys(Object.fromEntries(this.server.sockets.adapter.rooms),)
                .filter((room) => room.includes("user"))
                .map((room) => room.replace("user-", "")),)
        ];
    }

    emitToAll(event: SocketMessageType, data: object) {
        this.server.emit(event, data);
    }

    emitToUser(userId: string, event: SocketMessageType, data?: object) {
        this.server.to(`user-${userId}`).emit(event, data);
    }

    emitToUsers(userIds: string[], event: SocketMessageType, data: object) {
        Promise.all(userIds.map((userId) => this.emitToUser(userId, event, data)),);
    }

    emitToRoom(room: string, event: SocketMessageType, data: object) {
        this.server.to(room).emit(event, data);
    }

    emitToChatRoom(chatRoom: RoomWithUsers,
        event: SocketMessageType,
        data: object,) {
        this.emitToUsers(chatRoom.users.map((user) => user.id), event, data,);
    }

    emitAuctionExpireEvent(data: SocketAuctionExpireEntity) {
        this.emitToAll(SocketMessageType.AUCTIONS_EXPIRE, data);
    }

    emitAuctionBidEvent(data: SocketAuctionBidEntity) {
        this.emitToAll(SocketMessageType.AUCTIONS_BID, data);
    }

    emitLagbackEvent(client: Socket, x: number, y: number) {
        client.emit(SocketMessageType.LAGBACK, { x, y });
    }

    emitUserUpdatedEvent(data: Partial<PublicUser>) {
        this.emitToAll(SocketMessageType.USER_UPDATED, data);
    }

    emitUserRefetchMeEvent(userId: string) {
        this.emitToUser(userId, SocketMessageType.USER_REFETCH_ME);
    }

    emitPaymentMethodEvent(userId: string, data: SocketPaymentMethodEntity) {
        this.emitToUser(userId, SocketMessageType.STRIPE_PAYMENT_METHOD, data);
    }

    emitFriendsRequestReceivedEvent(userId: string, data: SocketFriendsEntity) {
        this.emitToUser(userId, SocketMessageType.FRIENDS_REQUEST_RECEIVED, data,);
    }

    emitFriendsRequestDeclinedEvent(userId: string, data: SocketFriendsEntity) {
        this.emitToUser(userId, SocketMessageType.FRIENDS_REQUEST_DECLINED, data,);
    }

    emitFriendsRequestRemovedEvent(userId: string, data: SocketFriendsEntity) {
        this.emitToUser(userId, SocketMessageType.FRIENDS_REQUEST_REMOVED, data,);
    }

    emitFriendsRemovedEvent(userId: string, data: SocketFriendsEntity) {
        this.emitToUser(userId, SocketMessageType.FRIENDS_REMOVED, data);
    }

    emitInsanePullEvent(data: SocketMarketInsanePullEntity) {
        this.emitToAll(SocketMessageType.MARKET_INSANE_PULL, data);
    }

    async tradingPlazaAddPlayer(client: Socket) {
        const alreadyExists = this.tradingPlazaEntities.player.find((player) => player.id === client.session.userId,);
        if (alreadyExists) return;

        this.emitToRoom("trading-plaza", SocketMessageType.TRADING_PLAZA_JOIN, {
            userId: client.session.userId
        });
        this.tradingPlazaEntities.player.push({
            id: client.session.userId,
            x: 0,
            y: 0,
            sitting: false,
            movedAt: Date.now()
        });

        client.join("trading-plaza");
    }

    async tradingPlazaRemovePlayer(client: Socket) {
        this.emitToRoom("trading-plaza", SocketMessageType.TRADING_PLAZA_LEAVE, { userId: client.session.userId },);
        this.tradingPlazaEntities.player =
            this.tradingPlazaEntities.player.filter((player) => player.id !== client.session.userId,);

        client.leave("trading-plaza");
    }

    async tradingPlazaMovePlayer(client: Socket,
        data: SocketTradingPlazaMoveDto,) {
        const player = this.tradingPlazaEntities.player.find((player) => player.id === client.session.userId,);
        if (!player) return;

        if (!this.validatePlazaMove(player, data)) {
            this.emitLagbackEvent(client, player.x, player.y);

            return;
        }

        player.x = data.x;
        player.y = data.y;
        player.movedAt = Date.now();

        this.emitToRoom("trading-plaza", SocketMessageType.TRADING_PLAZA_MOVE, {
            userId: client.session.userId,
            x: data.x,
            y: data.y
        });
    }
}

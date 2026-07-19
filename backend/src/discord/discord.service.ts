import { HttpService } from "@nestjs/axios";
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { UsersService } from "src/users/users.service";
import { RedisService } from "src/redis/redis.service";
import {
    DiscordAccessToken,
    DiscordLinkDto,
    DiscordDiscordUser,
    BadRequest,
    Unauthorized,
    InternalServerError
} from "@blacket/types";

const DiscordOauthStateTTLSeconds = 300;

@Injectable()
export class DiscordService {
    constructor(private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly httpService: HttpService,
        private readonly redisService: RedisService,) { }

    async createOAuthUrl(userId: string): Promise<string> {
        const state = randomUUID();
        const clientId = this.configService.get<string>("VITE_DISCORD_CLIENT_ID");
        const serverBaseUrl = this.configService.get<string>("SERVER_BASE_URL");

        if (!clientId || !serverBaseUrl) throw new InternalServerErrorException(InternalServerError.DEFAULT);

        await this.redisService.setKey("discordOAuthState", userId, { state }, DiscordOauthStateTTLSeconds,);

        const params = new URLSearchParams({
            client_id: clientId,
            response_type: "code",
            redirect_uri: serverBaseUrl + "/settings/link-discord",
            scope: "identify",
            state
        });

        return `https://discord.com/oauth2/authorize?${params.toString()}`;
    }

    async verifyOAuthState(userId: string, state: string): Promise<void> {
        const storedState = await this.redisService.getKey<{ state?: string }>("discordOAuthState", userId,);

        await this.redisService.deleteKey("discordOAuthState", userId);

        if (!state || !storedState?.state || storedState.state !== state) throw new BadRequestException(BadRequest.DEFAULT);
    }

    async getOAuthAccessTokenResponse(dto: DiscordLinkDto,): Promise<DiscordAccessToken> {
        if (!dto.code) throw new UnauthorizedException(Unauthorized.DEFAULT);

        try {
            const data = await this.httpService.axiosRef.post("https://discord.com/api/oauth2/token", {
                client_id: this.configService.get<string>("VITE_DISCORD_CLIENT_ID",),
                client_secret: this.configService.get<string>("SERVER_DISCORD_CLIENT_SECRET",),
                scope: "identify",
                grant_type: "authorization_code",
                code: dto.code,
                redirect_uri: encodeURI(this.configService.get<string>("SERVER_BASE_URL") +
                    "/settings/link-discord",)
            }, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            },);

            return data.data as DiscordAccessToken;
        } catch (err) {
            throw new InternalServerErrorException((err as Error).message ?? InternalServerError.DEFAULT);
        }
    }

    async getDiscordUser(accessTokenResponse: DiscordAccessToken,): Promise<DiscordDiscordUser> {
        try {
            const data = await this.httpService.axiosRef.get("https://discord.com/api/users/@me", {
                headers: {
                    Authorization: `${accessTokenResponse.token_type} ${accessTokenResponse.access_token}`
                }
            },);

            return data.data as DiscordDiscordUser;
        } catch {
            throw new InternalServerErrorException(InternalServerError.DEFAULT);
        }
    }

    async linkAccount(userId: string,
        accessTokenResponse: DiscordAccessToken,
        discordUser: DiscordDiscordUser,): Promise<void> {
        try {
            await this.usersService.linkDiscordOAuth(userId, accessTokenResponse, discordUser,);
        } catch {
            throw new InternalServerErrorException(InternalServerError.DEFAULT);
        }
    }
}

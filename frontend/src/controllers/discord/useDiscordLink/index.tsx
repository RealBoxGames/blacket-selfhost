import { DiscordLinkDto } from "@blacket/types";
import { DiscordLinkResponse } from "./useDiscordLink.d";

export function useDiscordLink() {
    const getOAuthUrl = () => new Promise<string>((resolve, reject) => window.fetch2.get("/api/discord/oauth-url")
        .then((res: Fetch2Response & { data: { url: string } }) => resolve(res.data.url))
        .catch(reject));

    const linkDiscord = (dto: DiscordLinkDto) => new Promise<DiscordLinkResponse>((resolve, reject) => window.fetch2.post("/api/discord/link", dto)
        .then((res: DiscordLinkResponse) => {
            resolve(res);
        })
        .catch(reject));

    return { getOAuthUrl, linkDiscord };
}


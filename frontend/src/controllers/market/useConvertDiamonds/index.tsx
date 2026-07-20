import { useUser } from "@stores/UserStore/index";

import { MarketConvertDiamondsDto } from "@blacket/types";

type CrystalsResponse = Fetch2Response & { data: { crystals: number } };

export function useConvertDiamonds() {
    const { user, setUser } = useUser();

    const convertToTokens = (dto: MarketConvertDiamondsDto) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.put("/api/market/convert-diamonds", dto)
        .then((res: Fetch2Response) => {
            if (user) setUser({ ...user, diamonds: user.diamonds - dto.amount, tokens: user.tokens + dto.amount * 3 });

            resolve(res);
        })
        .catch(reject));

    const convertToCrystals = (dto: MarketConvertDiamondsDto) => new Promise<CrystalsResponse>((resolve, reject) => window.fetch2.put("/api/market/convert-diamonds-to-crystals", dto)
        .then((res: CrystalsResponse) => {
            if (user) setUser({ ...user, diamonds: user.diamonds - dto.amount, crystals: user.crystals + res.data.crystals });

            resolve(res);
        })
        .catch(reject));

    return { convertToTokens, convertToCrystals };
}

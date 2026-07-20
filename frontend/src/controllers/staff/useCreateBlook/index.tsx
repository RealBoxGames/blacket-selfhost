import { Blook } from "@blacket/types";

type Response = Fetch2Response & { data: Blook };

export type BlookPayload = {
    name: string;
    description?: string;
    chance: number;
    price: number;
    rarityId: number;
    imageId: number;
    backgroundId: number;
    packId?: number;
    isBig?: boolean;
    canSell?: boolean;
    canTrade?: boolean;
    canAuction?: boolean;
};

export function useCreateBlook() {
    const createBlook = (dto: BlookPayload) => new Promise<Response>((resolve, reject) => window.fetch2.post("/api/staff/cms/blooks", dto)
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { createBlook };
}

import { Rarity } from "@blacket/types";

type Response = Fetch2Response & { data: Rarity[] };

export function useListRarities() {
    const listRarities = () => new Promise<Response>((resolve, reject) => window.fetch2.get("/api/staff/cms/rarities")
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { listRarities };
}

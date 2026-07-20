import { Blook } from "@blacket/types";

type Response = Fetch2Response & { data: Blook };

export function useSetBlookPack() {
    const setBlookPack = (blookId: number, packId: number | null) => new Promise<Response>((resolve, reject) => window.fetch2.put(`/api/staff/cms/blooks/${blookId}/pack`, { packId })
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { setBlookPack };
}

import { Pack } from "@blacket/types";

type Response = Fetch2Response & { data: Pack[] };

export function useListPacks() {
    const listPacks = () => new Promise<Response>((resolve, reject) => window.fetch2.get("/api/staff/cms/packs")
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { listPacks };
}

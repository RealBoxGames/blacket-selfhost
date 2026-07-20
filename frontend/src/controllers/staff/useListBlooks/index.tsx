import { Blook } from "@blacket/types";

type Response = Fetch2Response & { data: Blook[] };

export function useListBlooks() {
    const listBlooks = (search?: string) => new Promise<Response>((resolve, reject) => window.fetch2.get(`/api/staff/cms/blooks${search ? `?search=${encodeURIComponent(search)}` : ""}`)
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { listBlooks };
}

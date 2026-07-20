import { Blook } from "@blacket/types";
import { BlookPayload } from "../useCreateBlook";

type Response = Fetch2Response & { data: Blook };

export function useUpdateBlook() {
    const updateBlook = (id: number, dto: Partial<BlookPayload>) => new Promise<Response>((resolve, reject) => window.fetch2.patch(`/api/staff/cms/blooks/${id}`, dto)
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { updateBlook };
}

import { Pack } from "@blacket/types";
import { PackPayload } from "../useCreatePack";

type Response = Fetch2Response & { data: Pack };

export function useUpdatePack() {
    const updatePack = (id: number, dto: Partial<PackPayload>) => new Promise<Response>((resolve, reject) => window.fetch2.patch(`/api/staff/cms/packs/${id}`, dto)
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { updatePack };
}

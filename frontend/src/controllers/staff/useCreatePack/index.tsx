import { Pack } from "@blacket/types";

type Response = Fetch2Response & { data: Pack };

export type PackPayload = {
    name: string;
    price: number;
    imageId: number;
    iconId: number;
    backgroundId: number;
    ambienceId?: number;
    enabled?: boolean;
    hidden?: boolean;
};

export function useCreatePack() {
    const createPack = (dto: PackPayload) => new Promise<Response>((resolve, reject) => window.fetch2.post("/api/staff/cms/packs", dto)
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { createPack };
}

import { InventoryExistCountEntity } from "@blacket/types";

type Response = Fetch2Response & {
    data: InventoryExistCountEntity;
};

type ExistCountType = "BLOOK" | "ITEM";

export function useExistCount() {
    const getExistCount = (type: ExistCountType, id: number, shiny = false) => new Promise<Response>((resolve, reject) => {
        window.fetch2.get(`/api/inventory/exist-count/${type}/${id}/${shiny}`)
            .then((res: Response) => resolve(res))
            .catch(reject);
    });

    return {
        getExistCount
    };
}
import { DataBoostersEntity, InventoryUseItemDto, UserItem } from "@blacket/types";
import { useUser } from "@stores/UserStore/index";

type Response = Fetch2Response & {
    data: {
        item: Pick<UserItem, "id" | "itemId" | "usesLeft" | "createdAt" | "updatedAt">;
        boosters: DataBoostersEntity;
    };
};

// TODO: this response type should be updated to reflect the actual response from the backend

export function useItem() {
    const { user, setUser } = useUser();

    const useInventoryItem = (dto: InventoryUseItemDto) => new Promise<Response>((resolve, reject) => {
        window.fetch2.post("/api/inventory/use-item", dto)
            .then((res: Response) => {
                if (!user) return resolve(res);

                const items = user.items
                    .map((item) => item.id === res.data.item.id ? { ...item, ...res.data.item } : item)
                    .filter((item) => item.usesLeft > 0);

                setUser({ ...user, items });
                resolve(res);
            })
            .catch(reject);
    });

    return { useInventoryItem };
}

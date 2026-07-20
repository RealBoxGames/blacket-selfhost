import { StaffUserEntity } from "@blacket/types";

type Response = Fetch2Response & { data: StaffUserEntity };

export function useSetUserAvatar() {
    const setUserAvatar = (userId: string, blookId: number, shiny: boolean) => new Promise<Response>((resolve, reject) => window.fetch2.patch(`/api/staff/users/${userId}/avatar`, { blookId, shiny })
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { setUserAvatar };
}

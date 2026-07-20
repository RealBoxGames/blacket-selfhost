import { StaffUserEntity } from "@blacket/types";

type Response = Fetch2Response & { data: StaffUserEntity };

export function useEditUserGroups() {
    const editUserGroups = (userId: string, groupIds: number[]) => new Promise<Response>((resolve, reject) => window.fetch2.put(`/api/staff/users/${userId}/groups`, { groupIds })
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { editUserGroups };
}

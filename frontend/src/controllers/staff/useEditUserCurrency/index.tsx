import { StaffUserEntity } from "@blacket/types";

type Response = Fetch2Response & { data: StaffUserEntity };

export function useEditUserCurrency() {
    const editUserCurrency = (userId: string, dto: { tokens?: number; diamonds?: number; crystals?: number }) => new Promise<Response>((resolve, reject) => window.fetch2.patch(`/api/staff/users/${userId}/currency`, dto)
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { editUserCurrency };
}

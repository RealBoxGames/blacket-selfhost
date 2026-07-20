import { StaffUserEntity } from "@blacket/types";

type Response = Fetch2Response & { data: StaffUserEntity[] };

export function useSearchUsers() {
    const searchUsers = (search: string) => new Promise<Response>((resolve, reject) => window.fetch2.get(`/api/staff/users?search=${encodeURIComponent(search)}`)
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { searchUsers };
}

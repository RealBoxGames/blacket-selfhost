type StaffGroup = { id: number; name: string; priority: number };
type Response = Fetch2Response & { data: StaffGroup[] };

export function useStaffGroups() {
    const getGroups = () => new Promise<Response>((resolve, reject) => window.fetch2.get("/api/staff/groups")
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { getGroups };
}

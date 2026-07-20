type Response = Fetch2Response & { data: { id: number; path: string } };

export function useCreateResource() {
    const createResource = (path: string) => new Promise<Response>((resolve, reject) => window.fetch2.post("/api/staff/cms/resources", { path })
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { createResource };
}

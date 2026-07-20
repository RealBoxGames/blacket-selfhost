export function useDeletePack() {
    const deletePack = (id: number) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.delete(`/api/staff/cms/packs/${id}`, {})
        .then((res: Fetch2Response) => resolve(res))
        .catch(reject));

    return { deletePack };
}

export function useDeleteBlook() {
    const deleteBlook = (id: number) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.delete(`/api/staff/cms/blooks/${id}`, {})
        .then((res: Fetch2Response) => resolve(res))
        .catch(reject));

    return { deleteBlook };
}

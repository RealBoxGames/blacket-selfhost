type ChatCommand = { name: string; description: string; usage: string };
type Response = Fetch2Response & { data: ChatCommand[] };

export function useListCommands() {
    const listCommands = () => new Promise<Response>((resolve, reject) => window.fetch2.get("/api/chat/commands")
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { listCommands };
}

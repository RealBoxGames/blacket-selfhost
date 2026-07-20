export function useExecuteCommand() {
    const executeCommand = (roomId: number, command: string, args: string) => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.post(`/api/chat/messages/${roomId}/commands/${command}`, { args })
        .then((res: Fetch2Response) => resolve(res))
        .catch(reject));

    return { executeCommand };
}

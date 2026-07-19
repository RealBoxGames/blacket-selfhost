import { Socket } from "socket.io-client";

export interface SocketStore {
    socket: Socket | null;
    connected: boolean;
    getLatency: () => number;
    initializeSocket: () => void;
    forceLatencyUpdate: () => void;
    latency?: number;
}

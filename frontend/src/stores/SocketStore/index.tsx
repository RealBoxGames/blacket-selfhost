import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { io } from "socket.io-client";
import { SocketMessageType } from "@blacket/types";

import { SocketStore } from "./socketStore.d";

export const useSocket = create<SocketStore>()(
    subscribeWithSelector((set, get) => {
        const pingingRef = { current: true };
        const last10LatencyRef = { current: [] as number[] };
        const latencyRef = { current: 0 };

        return {
            socket: null,
            connected: false,

            getLatency: () => latencyRef.current,

            initializeSocket: () => {
                const oldSocket = get().socket;
                if (oldSocket?.connected) return;

                if (oldSocket) {
                    oldSocket.disconnect();
                    oldSocket.removeAllListeners();
                }

                const socket = io(`${location.protocol}//${location.host}`, {
                    path: "/gateway",
                    auth: { token: localStorage.getItem("token") },
                    transports: ["websocket"]
                });

                pingingRef.current = true;
                last10LatencyRef.current = [];

                socket.on("connect", () => {
                    set({ connected: true });

                    const sid = socket.id!;

                    const pingLoop = () => {
                        if (!pingingRef.current || socket.id !== sid) return;

                        const start = Date.now();

                        socket.emit(SocketMessageType.PING);
                        socket.once(SocketMessageType.PONG, () => {
                            const latency = Date.now() - start;
                            last10LatencyRef.current.push(latency);

                            if (last10LatencyRef.current.length > 10) {
                                last10LatencyRef.current.shift();
                            }

                            const average = last10LatencyRef.current.length < 10
                                ? Math.min(...last10LatencyRef.current)
                                : last10LatencyRef.current.reduce((a, b) => a + b, 0) / last10LatencyRef.current.length;

                            latencyRef.current = Math.round(average);

                            setTimeout(pingLoop, 1000);
                        });
                    };

                    pingLoop();

                    console.info("[Blacket] Connected to WebSocket server.");
                });

                socket.on("disconnect", () => {
                    set({ connected: false });

                    console.info("[Blacket] Disconnected from WebSocket server.");

                    if (localStorage.getItem("token")) {
                        console.info("[Blacket] Reconnecting to WebSocket server...");

                        setTimeout(() => get().initializeSocket(), 1000);
                    }

                    pingingRef.current = false;
                });

                if (import.meta.env.MODE === "development") {
                    socket.onAny((event: string, data: object) => {
                        if (event !== SocketMessageType.PING && event !== SocketMessageType.PONG) {
                            console.log({ event, data });
                        }
                    });

                    window.socket = socket;
                }

                set({ socket });
            },

            forceLatencyUpdate: () => {
                set({ latency: latencyRef.current });
            }
        };
    })
);

export const useSocketLatency = () => {
    const socket = useSocket();

    return {
        latency: socket.latency || socket.getLatency(),
        forceUpdate: socket.forceLatencyUpdate
    };
};

export const useSocketConnection = () => useSocket((state) => ({
    connected: state.connected,
    socket: state.socket
}));

export const useSocketInstance = () => useSocket((state) => state.socket);

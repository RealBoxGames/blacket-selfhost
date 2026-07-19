import { create } from "zustand";

import { InsanePullStore } from "./insanePullStore.d";

export const useInsanePull = create<InsanePullStore>((set) => ({
    video: null,
    isPlaying: false,
    setVideo: (video) => set({ video }),
    setIsPlaying: (isPlaying) => set({ isPlaying })
}));

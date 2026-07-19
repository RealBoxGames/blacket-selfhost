import { create } from "zustand";

import { ResourceStore } from "./resourceStore.d";

export const useResource = create<ResourceStore>((set, get) => ({
    resources: [],

    setResources: (resources) => set({ resources }),

    getResourceById(id) {
        return get().resources.find((r) => r.id === id);
    },

    resourceIdToPath: (id) => {
        if (!id) return window.errorImage;

        const resource = get().resources.find((r) => r.id === id);

        return resource ? resource.path.replace("{cdn}", window.constructCDNUrl("")) : window.errorImage;
    }
}));

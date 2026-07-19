import { create } from "zustand";
import { localStorage } from "@functions/core/localStorage";

import { ModalStore } from "./modalStore.d";

export const useModal = create<ModalStore>((set, get) => ({
    modals: [],

    setModals: (modals) => set({ modals }),

    createModal: (modal, props) => {
        const id = Math.random().toString(36).slice(2);

        set((s) => ({ modals: [...s.modals, { id, modal, props }] }));

        return id;
    },

    closeModal: () => {
        if (!localStorage.get("settings:modalAnimation")) {
            set((s) => ({ modals: s.modals.slice(1) }));
        } else {
            set({ closing: true });
        }
    },

    closing: false,

    setClosing: (c) => set({ closing: c })
}));

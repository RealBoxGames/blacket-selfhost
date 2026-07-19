import { create } from "zustand";

import { ContextMenuStore } from "./contextMenu.d";

let _cursorPosition = { x: 0, y: 0 };

export const useContextMenu = create<ContextMenuStore>((set) => ({
    contextMenu: null,
    setContextMenu: (contextMenu) => set({ contextMenu }),
    openContextMenu: (items) => set({
        contextMenu: {
            items,
            x: _cursorPosition.x,
            y: _cursorPosition.y
        }
    }),
    closeContextMenu: () => set({ contextMenu: null })
}));

if (typeof window !== "undefined") {
    window.addEventListener("mousemove", (e) => _cursorPosition = { x: e.clientX, y: e.clientY });

    window.addEventListener("mousedown", (e) => {
        const target = e.target as HTMLElement;

        if (!target.closest("[data-context-menu]")) {
            useContextMenu.getState().closeContextMenu();
        }
    });
}

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { create } from "zustand";
import { PrivateUser, PermissionType } from "@blacket/types";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useCachedUser } from "@stores/CachedUserStore/index";

import { UserStore } from "./userStore.d";

let _lowPerformanceCache: boolean | null = null;

function isLowPerformanceDevice() {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 2;

    const start = performance.now();

    for (let i = 0; i < 1e6; i++) Math.sqrt(i);

    const duration = performance.now() - start;

    return (
        cores < 4 ||
        memory < 4 ||
        duration > 80
    );
}

const isChromebook = /\bCrOS\b/.test(navigator.userAgent);

export const useUserStore = create<UserStore>((set, get) => {
    return {
        user: null,

        setUser: (user: PrivateUser | null) => {
            if (user) {
                user.hasPermission = (permission: PermissionType) => user.permissions.includes(permission);
                user.setTokens = (tokens: number) => {
                    set({ user: { ...user, tokens } });

                    return tokens;
                };
                user.setDiamonds = (diamonds: number) => {
                    set({ user: { ...user, diamonds } });


                    return diamonds;
                };
            }

            set({ user });

            if (import.meta.env.MODE === "development") window.user = user ?? undefined;
        },

        getUserAvatarPath: () => window.constructCDNUrl("/content/blooks/Default.png"),
        getUserBannerPath: () => window.constructCDNUrl("/content/banners/Default.png"),

        isAvatarBig: () => false,

        isLowPerformance: () => false,

        getBlookAmount: (blookId: number, shiny: boolean, usr?: PrivateUser) => {
            const user = usr || get().user;
            if (!user) return 0;

            const blooks = user.blooks.filter((b) => b.blookId === blookId && b.shiny === shiny);
            return blooks.length;
        },

        getItemAmount: (itemId: number, usr?: PrivateUser) => {
            const user = usr || get().user;
            if (!user) return 0;

            const items = user.items.filter((i) => i.itemId === itemId);
            return items.length;
        }
    };
});

export function useUser() {
    const { user, setUser, getBlookAmount, getItemAmount } = useUserStore();

    const { blooks } = useData();
    const { resourceIdToPath } = useResource();
    const { addCachedUserWithData } = useCachedUser();

    const location = useLocation();
    // const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            addCachedUserWithData(user);

            // if (!location.pathname.startsWith("/rules") && !user.readRulesAt) navigate("/rules");
        }
    }, [user, location]);

    const getUserAvatarPath = (user: PrivateUser | null): string => {
        if (!user) return window.constructCDNUrl("/content/icons/error.png");

        if (user.customAvatar)
            return `${import.meta.env.VITE_CDN_URL}/users/${user.customAvatar.userId}/${user.customAvatar.uploadId}/${user.customAvatar.filename}`;
        else if (user.avatar) {
            const blook = blooks.find((b) => b.id === user.avatar?.blookId);
            if (!blook) return window.constructCDNUrl("/content/blooks/Default.png");
            return resourceIdToPath(blook.imageId) || window.errorImage;
        }

        return window.constructCDNUrl("/content/blooks/Default.png");
    };

    const getUserBannerPath = (user: PrivateUser | null): string => {
        if (!user) return window.constructCDNUrl("/content/icons/error.png");

        if (user.customBanner)
            return `${import.meta.env.VITE_CDN_URL}/users/${user.customBanner.userId}/${user.customBanner.uploadId}/${user.customBanner.filename}`;
        else if (user.bannerId)
            return resourceIdToPath(user.bannerId) || window.errorImage;

        return window.constructCDNUrl("/content/banners/Default.png");
    };

    const isAvatarBig = (usr: PrivateUser | null): boolean => {
        const u = usr || user;

        if (u?.avatar?.blookId) {
            const blook = blooks.find((b) => b.id === u.avatar?.blookId);

            return blook ? blook.isBig : false;
        }

        return false;
    };

    const isLowPerformance = () => {
        if (user?.settings.lowPerformanceMode) return true;
        if (user?.settings.lowPerformanceMode === false) return false;
        else {
            if (_lowPerformanceCache !== null) return _lowPerformanceCache;

            const low = isLowPerformanceDevice() || isChromebook;

            if (_lowPerformanceCache === null) _lowPerformanceCache = low;

            return _lowPerformanceCache;
        }
    };

    return {
        user,
        setUser,
        getBlookAmount,
        getItemAmount,
        getUserAvatarPath,
        getUserBannerPath,
        isAvatarBig,
        isLowPerformance
    };
}

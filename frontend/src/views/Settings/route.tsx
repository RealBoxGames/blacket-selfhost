import Settings from "./index";

export default {
    path: "/settings",
    aliases: [
        "/settings/account",
        "/settings/social",
        "/settings/security",
        "/settings/cosmetics",
        "/settings/legal"
    ],
    component: <Settings />,
    title: `Settings | ${import.meta.env.VITE_INFORMATION_NAME}`,
    description: "Change the settings of your account.",
    sidebar: true,
    topRight: [],
    pageHeader: "Settings"
} as BlacketRoute;

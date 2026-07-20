import PacksPage from "./index";

export default {
    path: "/staff/packs",
    component: <PacksPage />,
    title: `Packs | ${import.meta.env.VITE_INFORMATION_NAME}`,
    pageHeader: "Packs",
    sidebar: true,
    topRight: []
} as BlacketRoute;

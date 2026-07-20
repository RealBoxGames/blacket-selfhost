import BlooksPage from "./index";

export default {
    path: "/staff/blooks",
    component: <BlooksPage />,
    title: `Blooks | ${import.meta.env.VITE_INFORMATION_NAME}`,
    pageHeader: "Blooks",
    sidebar: true,
    topRight: []
} as BlacketRoute;

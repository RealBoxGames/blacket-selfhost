import Test from "./index";

export default {
    path: "/test",
    component: <Test />,
    title: `Test | ${import.meta.env.VITE_INFORMATION_NAME}`,
    sidebar: true,
    topRight: []
} as BlacketRoute;

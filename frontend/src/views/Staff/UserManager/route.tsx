import StaffUserManager from "./index";

export default {
    path: "/staff/users",
    component: <StaffUserManager />,
    title: `User Manager | ${import.meta.env.VITE_INFORMATION_NAME}`,
    pageHeader: "User Manager",
    sidebar: true,
    topRight: []
} as BlacketRoute;

import Legal from "./index";

export default {
    path: "/legal",
    aliases: [
        "/eula",
        "/terms",
        "/privacy"
    ],
    component: <Legal />,
    header: {}
} as BlacketRoute;

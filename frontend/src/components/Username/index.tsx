import { useData } from "@stores/DataStore/index";
import styles from "./username.module.scss";

import { RoleColor, UsernameProps } from "./username.d";

const ROLE_COLORS: RoleColor[] = [
    {
        key: "isSystem",
        color: "var(--secondary-color)",
        text: "SYSTEM"
    },
    {
        key: "isAi",
        color: "linear-gradient(45deg, blue, blueviolet, violet)",
        text: "AI"
    }
];

export default function Username({ user, className, style = {}, ...props }: UsernameProps) {
    const { fontIdToName } = useData();

    if (!user) return null;
    if (!user.color) return null;

    let gradientStyle = {};
    if (user.color.includes("|")) {
        const [degrees, colors] = user.color.split("|");
        const colorArray = colors.split(",").map((color) => {
            const [hex, stop] = color.split("@");
            return stop ? `${hex} ${stop}%` : hex;
        });

        gradientStyle = {
            background: `linear-gradient(${degrees}deg, ${colorArray.join(", ")}) text`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
        };
    }

    const role = ROLE_COLORS.find((role) => (user as any)[role.key]);

    return <span
        className={`
            ${className ? `${className}` : ""}
            ${user.color === "rainbow" ? "rainbow" : ""}
        `}
        style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            ...style
        }}
        {...props}
    >
        <span style={{
            color: user.color,
            fontFamily: fontIdToName(user.fontId!),
            ...gradientStyle
        }}>
            {user.username}
        </span>

        {role && <span
            className={styles.badge}
            style={{
                background: role.color
            }}
        >
            <span>
                {role.text}
            </span>
        </span>}
    </span >;
}

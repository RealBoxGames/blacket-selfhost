import { PrivateUser } from "@blacket/types";

export interface MarkdownProps {
    userOverride?: PrivateUser;
    children: string;
}

import { ReactNode } from "react";
import { Username } from "@components/index";
import Checkmark from "../Checkmark";

import { PrivateUser } from "@blacket/types";

export default function processMarkdownTokens(children: ReactNode, user?: PrivateUser): React.ReactNode {
    if (typeof children === "string") {
        const tokens = [
            { pattern: ":check:", render: () => <Checkmark /> },
            { pattern: "{username}", render: () => user ? <Username user={user} /> : "{username}" }
        ];

        let result: ReactNode[] = [children];

        for (const token of tokens) {
            const newResult: ReactNode[] = [];

            for (const part of result) {
                if (typeof part === "string" && part.includes(token.pattern)) {
                    const segments = part.split(token.pattern);

                    segments.forEach((segment, i) => {
                        if (segment) newResult.push(segment);
                        if (i < segments.length - 1) newResult.push(token.render());
                    });
                } else {
                    newResult.push(part);
                }
            }

            result = newResult;
        }

        return result.map((part, i) => <span key={i}>{part}</span>);
    }

    if (Array.isArray(children)) return children.map((child, i) => <span key={i}>{processMarkdownTokens(child, user)}</span>);

    return children;
}

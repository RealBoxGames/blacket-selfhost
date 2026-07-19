import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useUser } from "@stores/UserStore/index";
import { processMarkdownTokens } from "./functions/index";

import { MarkdownProps } from "./markdown.d";

export default function Markdown({ userOverride, children }: MarkdownProps) {
    const { user } = useUser();

    const currentUser = userOverride ?? user;

    return (
        <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
                p({ children }) {
                    return <p>{processMarkdownTokens(children, currentUser ?? undefined)}</p>;
                }
            }}
        >
            {children}
        </ReactMarkdown>
    );
}

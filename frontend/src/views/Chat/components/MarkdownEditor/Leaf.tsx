import { CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCachedUser } from "@stores/CachedUserStore/index";
import { useModal } from "@stores/ModalStore/index";
import AreYouSureLinkModal from "../AreYouSureLinkModal";
import { LeafProps } from "../../chat.d";

const BAD_MENTION = "@Unknown User";

export default function Leaf({ attributes, children, leaf, readOnly }: LeafProps) {
    const { addCachedUser } = useCachedUser();
    const { createModal } = useModal();
    const navigate = useNavigate();

    const [mentionUsername, setMentionUsername] = useState<string>(leaf.mention ? "@..." : "");

    useEffect(() => {
        if (leaf.mention && leaf.content?.text) {
            addCachedUser(leaf.content.text).then((user) => {
                setMentionUsername(user ? `@${user.username}` : BAD_MENTION);
            });
        }
    }, [leaf.mention, leaf.content?.text, addCachedUser]);

    const hasStyles = !!(leaf.bold || leaf.italic || leaf.underlined || leaf.strikethrough || leaf.color);
    const isFunctional = !!(leaf.link || leaf.mention);
    const hasText = !!(leaf.content?.text || (typeof children === "string" && children.length > 0));

    if (!hasStyles && !isFunctional || (leaf.content?.text === "" && !hasText)) {
        return (
            <span {...attributes}>
                {children}
            </span>
        );
    }

    if (leaf.link && leaf.content?.text) {
        return (
            <a {...attributes}
               href={leaf.content.text}
               target="_blank"
               rel="noopener noreferrer"
               onClick={(e) => {
                   if (readOnly) {
                       e.preventDefault();
                       createModal(<AreYouSureLinkModal link={leaf.content!.text} />);
                   }
               }}>
                {children}
            </a>
        );
    }

    if (leaf.mention && leaf.content?.text) {
        return (
            <span {...attributes}
                  className="mention"
                  style={{ cursor: readOnly ? "pointer" : "default" }}
                  onClick={() => {
                      if (readOnly && mentionUsername !== BAD_MENTION) {
                          navigate(`/dashboard?name=${leaf.content!.text}`);
                      }
                  }}>
                {readOnly ? mentionUsername : children}
            </span>
        );
    }

    const style: CSSProperties = {};
    if (leaf.bold) style.fontWeight = "bold";
    if (leaf.italic) style.fontStyle = "italic";
    if (leaf.underlined || leaf.strikethrough) {
        style.textDecoration = [
            leaf.underlined ? "underline" : "",
            leaf.strikethrough ? "line-through" : ""
        ].filter(Boolean).join(" ");
    }
    if (leaf.color && leaf.content?.color) {
        style.color = leaf.content.color;
    }

    return <span {...attributes} style={style}>{children}</span>;
}

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import Twemoji from "react-twemoji";
import { Editor, Transforms, Range, createEditor } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { useUser } from "@stores/UserStore/index";
import { useCachedUser } from "@stores/CachedUserStore/index";
import { Blook, Username } from "@components/index";
import { withCustomElement, insertEmoji, insertMention, insertCommand } from "./utils";
import { useListCommands } from "@controllers/chat/useListCommands";
import decorate from "./decorate";
import Element from "./elements";
import Leaf from "./Leaf";
import styles from "../../chat.module.scss";

import { MarkdownEditorProps } from "../../chat.d";

type ChatCommand = { name: string; description: string; usage: string };

export default function MarkdownEditor({ content, color, readOnly, getEditor = () => { }, ...props }: MarkdownEditorProps) {
    const { getUserAvatarPath } = useUser();
    const { cachedUsers } = useCachedUser();
    const { listCommands } = useListCommands();

    const mentionRef = useRef<HTMLDivElement | null>(null);
    const emojiRef = useRef<HTMLDivElement | null>(null);
    const slashRef = useRef<HTMLDivElement | null>(null);

    const [mentionSearch, setMentionSearch] = useState<string>("");
    const [emojiSearch, setEmojiSearch] = useState<string>("");
    const [slashSearch, setSlashSearch] = useState<string>("");
    const [mentionTarget, setMentionTarget] = useState<Range | null>(null);
    const [emojiTarget, setEmojiTarget] = useState<Range | null>(null);
    const [slashTarget, setSlashTarget] = useState<Range | null>(null);

    const [availableCommands, setAvailableCommands] = useState<ChatCommand[]>([]);

    useEffect(() => {
        if (readOnly) return;

        listCommands().then((res) => setAvailableCommands(res.data)).catch(() => setAvailableCommands([]));
    }, [readOnly]);

    const editor = useMemo(() => withCustomElement(withReact(createEditor())), []);

    useEffect(() => {
        getEditor(editor);
    }, [editor, getEditor]);

    const mentionUsers = useMemo(() => {
        if (!mentionSearch) return [];
        return cachedUsers.filter((u) => u.username.toLowerCase().startsWith(mentionSearch.toLowerCase())).slice(0, 10);
    }, [mentionSearch, cachedUsers]);

    const emojis = useMemo(() => {
        if (!emojiSearch) return [];
        return window.constants.emojis.filter((e) => e.key.toLowerCase().startsWith(emojiSearch.toLowerCase())).slice(0, 10);
    }, [emojiSearch]);

    const commands = useMemo(() => {
        return availableCommands.filter((c) => c.name.toLowerCase().startsWith(slashSearch.toLowerCase())).slice(0, 10);
    }, [slashSearch, availableCommands]);

    const [mentionUserId, setMentionUserId] = useState<string>("");
    const [emojiName, setEmojiName] = useState<string>("");
    const [slashName, setSlashName] = useState<string>("");

    useEffect(() => {
        setMentionUserId(mentionUsers[0]?.id || "");
    }, [mentionUsers]);
    useEffect(() => {
        setEmojiName(emojis[0]?.key || "");
    }, [emojis]);
    useEffect(() => {
        setSlashName(commands[0]?.name || "");
    }, [commands]);

    const initialValue = useMemo(() => {
        const rawContent = content?.toString() || "";
        if (!rawContent.trim()) {
            return [{ type: "paragraph" as const, children: [{ text: "" }] }];
        }
        return rawContent.split("\n").map((text: string) => ({
            type: "paragraph" as const,
            children: [{ text }]
        }));
    }, [content]);

    const renderElement = useCallback((p: any) => <Element {...p} />, []);
    const renderLeaf = useCallback((p: any) => <Leaf {...p} readOnly={readOnly} />, [readOnly]);

    const handleSlateChange = useCallback(() => {
        const { selection } = editor;

        if (selection && Range.isCollapsed(selection)) {
            const [start] = Range.edges(selection);
            const lineStart = Editor.start(editor, start.path);
            const beforeRange = { anchor: lineStart, focus: start };
            const beforeText = Editor.string(editor, beforeRange);

            const slashMatch = beforeText.match(/^\/(\w*)$/);
            if (slashMatch) {
                const matchText = slashMatch[0];
                const matchStart = Editor.before(editor, start, { distance: matchText.length, unit: "character" });
                if (matchStart) {
                    setSlashTarget({ anchor: matchStart, focus: start });
                    setSlashSearch(slashMatch[1]);
                    setMentionTarget(null);
                    setEmojiTarget(null);
                    return;
                }
            }

            const mentionMatch = beforeText.match(/@(\w*)$/);
            if (mentionMatch) {
                const matchText = mentionMatch[0];
                const matchStart = Editor.before(editor, start, { distance: matchText.length, unit: "character" });
                if (matchStart) {
                    setMentionTarget({ anchor: matchStart, focus: start });
                    setMentionSearch(mentionMatch[1]);
                    setEmojiTarget(null);
                    setSlashTarget(null);
                    return;
                }
            }

            const emojiMatch = beforeText.match(/:(\w+)$/);
            if (emojiMatch) {
                const matchText = emojiMatch[0];
                const matchStart = Editor.before(editor, start, { distance: matchText.length, unit: "character" });
                if (matchStart) {
                    setEmojiTarget({ anchor: matchStart, focus: start });
                    setEmojiSearch(emojiMatch[1]);
                    setMentionTarget(null);
                    setSlashTarget(null);
                    return;
                }
            }
        }

        setMentionTarget(null);
        setEmojiTarget(null);
        setSlashTarget(null);
    }, [editor]);

    return (
        <div className={styles.editorWrapper} style={{ position: "relative", flex: 1, width: "100%" }}>
            <Slate editor={editor} initialValue={initialValue} onChange={handleSlateChange}>
                {!readOnly && mentionTarget && mentionUsers.length > 0 && (
                    <div ref={mentionRef} className={styles.typingListContainer}>
                        {mentionUsers.map((user) => (
                            <div key={user.id} className={styles.typingListItem} data-selected={user.id === mentionUserId}
                                onClick={() => {
                                    Transforms.select(editor, mentionTarget);
                                    insertMention(editor, user);
                                    Transforms.insertText(editor, " ");
                                    setMentionTarget(null);
                                }}>
                                <div className={styles.typingListItemImage}>
                                    <Blook src={getUserAvatarPath(user)} shiny={user.avatar?.shiny} draggable={false} />
                                </div>
                                <Username user={user} />
                            </div>
                        ))}
                    </div>
                )}

                {!readOnly && emojiTarget && emojis.length > 0 && (
                    <div ref={emojiRef} className={styles.typingListContainer}>
                        {emojis.map((emoji) => (
                            <div key={emoji.key} className={styles.typingListItem} data-selected={emoji.key === emojiName}
                                onClick={() => {
                                    Transforms.select(editor, emojiTarget);
                                    insertEmoji(editor, emoji.value);
                                    setEmojiTarget(null);
                                }}>
                                <Twemoji options={{ className: styles.typingListItemImage }}>{emoji.value}</Twemoji>
                                <div>{emoji.key}</div>
                            </div>
                        ))}
                    </div>
                )}

                {!readOnly && slashTarget && commands.length > 0 && (
                    <div ref={slashRef} className={styles.typingListContainer}>
                        {commands.map((command) => (
                            <div key={command.name} className={styles.typingListItem} data-selected={command.name === slashName}
                                onClick={() => {
                                    Transforms.select(editor, slashTarget);
                                    insertCommand(editor, command.name);
                                    setSlashTarget(null);
                                }}>
                                <div>
                                    <div>/{command.name}</div>
                                    <div style={{ fontSize: "0.8em", opacity: 0.7 }}>{command.description}</div>
                                    <div style={{ fontSize: "0.75em", opacity: 0.5 }}>{command.usage}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    decorate={decorate}
                    readOnly={readOnly}
                    style={{ color: color, outline: "none" }}
                    placeholder="Type message..."
                    {...props}
                    onKeyDown={(e) => {
                        const target = mentionTarget || emojiTarget || slashTarget;

                        if (target) {
                            const items: any[] = mentionTarget ? mentionUsers : emojiTarget ? emojis : commands;
                            const activeId = mentionTarget ? mentionUserId : emojiTarget ? emojiName : slashName;
                            const getKey = (item: any) => mentionTarget ? item.id : emojiTarget ? item.key : item.name;

                            switch (e.key) {
                                case "ArrowDown": {
                                    e.preventDefault();
                                    const nextIdx = items.findIndex((i) => getKey(i) === activeId) + 1;
                                    const next = items[nextIdx % items.length];
                                    if (mentionTarget) setMentionUserId(next.id);
                                    else if (emojiTarget) setEmojiName(next.key);
                                    else setSlashName(next.name);
                                    return;
                                }
                                case "ArrowUp": {
                                    e.preventDefault();
                                    const prevIdx = items.findIndex((i) => getKey(i) === activeId) - 1;
                                    const prev = items[(prevIdx + items.length) % items.length];
                                    if (mentionTarget) setMentionUserId(prev.id);
                                    else if (emojiTarget) setEmojiName(prev.key);
                                    else setSlashName(prev.name);
                                    return;
                                }
                                case "Tab":
                                case "Enter":
                                    e.preventDefault();
                                    Transforms.select(editor, target);
                                    if (mentionTarget) {
                                        const user = mentionUsers.find((u) => u.id === mentionUserId);
                                        if (user) {
                                            insertMention(editor, user); Transforms.insertText(editor, " ");
                                        }
                                    } else if (emojiTarget) {
                                        const emoji = emojis.find((em) => em.key === emojiName);
                                        if (emoji) insertEmoji(editor, emoji.value);
                                    } else {
                                        const command = commands.find((c) => c.name === slashName);
                                        if (command) insertCommand(editor, command.name);
                                    }
                                    setMentionTarget(null);
                                    setEmojiTarget(null);
                                    setSlashTarget(null);
                                    return;
                                case "Escape":
                                    e.preventDefault();
                                    setMentionTarget(null);
                                    setEmojiTarget(null);
                                    setSlashTarget(null);
                                    return;
                            }
                        }

                        if (e.key === ":") {
                            const { selection } = editor;
                            if (selection && Range.isCollapsed(selection)) {
                                const [start] = Range.edges(selection);
                                const wordBefore = Editor.before(editor, start, { unit: "word" });
                                const range = wordBefore && Editor.range(editor, wordBefore, start);
                                const text = range && Editor.string(editor, range);
                                if (text?.startsWith(":")) {
                                    const emoji = window.constants.emojis.find((em) => em.key === text.slice(1).toLowerCase());
                                    if (emoji) {
                                        e.preventDefault();
                                        Transforms.select(editor, range!);
                                        insertEmoji(editor, emoji.value);
                                        return;
                                    }
                                }
                            }
                        }

                        if (props.onKeyDown) props.onKeyDown(e);
                    }}
                />
            </Slate>
        </div>
    );
}

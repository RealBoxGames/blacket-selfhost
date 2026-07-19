import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChatStore, useChat } from "@stores/ChatStore/index";
import { useSocket } from "@stores/SocketStore/index";
import { useUser } from "@stores/UserStore/index";
import { useCachedUser } from "@stores/CachedUserStore/index";
import { useToast } from "@stores/ToastStore/index";

import { ClientMessage, TypingUser } from "../chatStore";
import { PermissionTypeEnum, SocketMessageType } from "@blacket/types";

export default function ChatDefiner() {
    const { messages, room, setReplyingTo } = useChatStore();
    const { fetchMessages } = useChat();

    const { connected, socket } = useSocket();
    const { user, getUserAvatarPath } = useUser();
    const { addCachedUser } = useCachedUser();
    const { createToast } = useToast();

    const location = useLocation();
    const navigate = useNavigate();

    const locationRef = useRef(location);
    const messagesRef = useRef(messages);

    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const parseContent = async (content: string): Promise<string> => {
        const matches = [...content.matchAll(/<@(\d+)>/g)];
        if (matches.length === 0) return content;

        const replacements = await Promise.all(
            matches.map(async (match) => {
                const userId = match[1];
                const cachedUser = await addCachedUser(userId);

                return {
                    original: match[0],
                    replacement: cachedUser ? `@${cachedUser.username}` : `<@${userId}>`
                };
            })
        );

        let result = content;
        for (const { original, replacement } of replacements) result = result.replace(original, replacement);
        return result;
    };

    const addMention = async (message: ClientMessage) => {
        if (!user) return;

        const l = locationRef.current.pathname.split("/")[1];
        if (l === "chat") return;

        const cachedUser = await addCachedUser(message.authorId);

        if (message.mentions.includes(user.id) || message.replyingTo?.authorId === user.id) {
            useChatStore.setState((s) => ({ mentions: s.mentions + 1 }));

            createToast({
                header: cachedUser.username,
                body: await parseContent(message.content),
                icon: getUserAvatarPath(cachedUser),
                sound: "mention",
                onClick: () => {
                    navigate("/chat");
                    setReplyingTo(message);
                }
            });
        }
    };

    // const onChatMessageCreate = (data: ClientMessage) => {
    //     if (!user) return;

    //     addMention(data);

    //     const nonce = data.nonce;
    //     if (!nonce) return;

    //     const prevMessage = messagesRef.current.find((m) => m.nonce === nonce);
    //     if (!prevMessage) return useChatStore.setState((s) => ({
    //         messages: [{ ...data, nonce: undefined }, ...s.messages]
    //     }));

    //     const newMessage = { ...prevMessage, ...data, nonce: undefined };

    //     useChatStore.setState((s) => ({
    //         messages: s.messages.map((m) => (m.nonce === nonce ? newMessage : m))
    //     }));
    // };
    const onChatMessageCreate = (data: ClientMessage) => {
        if (!user) return;

        addMention(data);

        const nonce = data.nonce;

        if (!nonce) {
            useChatStore.setState((s) => {
                if (s.messages.some((m) => m.id === data.id)) return s;

                return {
                    messages: [{ ...data, nonce: undefined }, ...s.messages]
                };
            });

            return;
        }

        useChatStore.setState((s) => {
            const messageIndex = s.messages.findIndex((m) => m.nonce === nonce);

            if (messageIndex === -1) {
                return {
                    messages: [{ ...data, nonce: undefined }, ...s.messages]
                };
            }

            const newMessages = [...s.messages];
            newMessages[messageIndex] = {
                ...newMessages[messageIndex],
                ...data,
                nonce: undefined
            };

            return { messages: newMessages };
        });
    };

    const onChatMessageUpdate = (data: ClientMessage) => {
        if (!user) return;

        const prev = messagesRef.current.find((m) => m.id === data.id);
        if (!prev) return;

        const newMessage = { ...prev, content: data.content, editedAt: new Date() };

        useChatStore.setState((s) => ({
            messages: s.messages.map((m) => (m.id === data.id ? newMessage : m))
        }));
    };

    const onChatMessagesDelete = ({ messageId }: { messageId: string }) => {
        if (!user) return;

        useChatStore.setState((s) => ({
            messages: user!.hasPermission(PermissionTypeEnum.MANAGE_MESSAGES)
                ? s.messages.map((m) => m.id === messageId ? { ...m, deleted: true } : m)
                : s.messages.filter((m) => m.id !== messageId)
        }));
    };

    const onChatStartTyping = (data: TypingUser) => {
        if (!user || data.userId === user.id) return;

        addCachedUser(data.userId);

        data.startedTypingAt = Date.now();

        useChatStore.setState((s) => {
            if (s.usersTyping.find((u) => u.userId === data.userId)) return s;

            return { usersTyping: [...s.usersTyping, data] };
        });
    };

    useEffect(() => {
        if (!connected || !user || !socket) return;

        fetchMessages(room);

        let tickTimeoutId: any;

        const tick = () => {
            const now = Date.now();

            useChatStore.setState((s) => {
                const filteredTyping = s.usersTyping.filter((u) => now - u.startedTypingAt < 2500);

                if (filteredTyping.length === s.usersTyping.length) return s;

                return { usersTyping: filteredTyping };
            });

            tickTimeoutId = setTimeout(tick, 1000);
        };

        tick();

        socket.on(SocketMessageType.CHAT_MESSAGES_CREATE, onChatMessageCreate);
        socket.on(SocketMessageType.CHAT_MESSAGES_UPDATE, onChatMessageUpdate);
        socket.on(SocketMessageType.CHAT_MESSAGES_DELETE, onChatMessagesDelete);
        socket.on(SocketMessageType.CHAT_TYPING_STARTED, onChatStartTyping);

        return () => {
            if (tickTimeoutId) clearTimeout(tickTimeoutId);

            socket.off(SocketMessageType.CHAT_MESSAGES_CREATE, onChatMessageCreate);
            socket.off(SocketMessageType.CHAT_MESSAGES_UPDATE, onChatMessageUpdate);
            socket.off(SocketMessageType.CHAT_MESSAGES_DELETE, onChatMessagesDelete);
            socket.off(SocketMessageType.CHAT_TYPING_STARTED, onChatStartTyping);
        };
    }, [connected, user, socket, room]);

    return null;
}

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useChat, useChatStore } from "@stores/ChatStore/index";
import { useCachedUser } from "@stores/CachedUserStore/index";
import { Blook, Username } from "@components/index";
import { ChatMessagesContainer, ChatMessage, InputContainer } from "../Chat/components";
import { useListDms } from "@controllers/chat/useListDms";
import { useFindOrCreateDm } from "@controllers/chat/useFindOrCreateDm";
import styles from "./directMessages.module.scss";

import { PublicUser } from "@blacket/types";

type DmEntry = { roomId: number; otherUser: { id: string; username: string; avatar?: { blookId: number; shiny: boolean } | null } | null };

export default function DirectMessages() {
    const { user, getUserAvatarPath } = useUser();
    const { userId } = useParams<{ userId?: string }>();
    const navigate = useNavigate();

    const { listDms } = useListDms();
    const { findOrCreateDm } = useFindOrCreateDm();
    const { cachedUsers, addCachedUser } = useCachedUser();

    const { messages } = useChat();
    const { room, setRoom, unreadDmUserIds, clearDmUnread } = useChatStore();

    const [dms, setDms] = useState<DmEntry[]>([]);
    const [loadingDms, setLoadingDms] = useState<boolean>(true);

    if (!user) return <Navigate to="/login" />;

    const refreshDms = () => {
        listDms()
            .then((res) => {
                setDms(res.data);
                res.data.forEach((dm: DmEntry) => dm.otherUser && addCachedUser(dm.otherUser.id));
            })
            .catch(() => setDms([]))
            .finally(() => setLoadingDms(false));
    };

    useEffect(() => {
        refreshDms();
    }, []);

    useEffect(() => {
        if (!userId) return;

        addCachedUser(userId);
        clearDmUnread(userId);

        // if we already know this conversation's room (switching between
        // already-loaded DMs), switch instantly instead of round-tripping
        // through find-or-create every click
        const existing = dms.find((d) => d.otherUser?.id === userId);
        if (existing) {
            setRoom(existing.roomId);
            return;
        }

        findOrCreateDm(userId)
            .then((res) => {
                setRoom(res.data.roomId);
                refreshDms();
            })
            .catch(() => navigate("/direct-messages"));
    }, [userId, dms]);

    // resolves a DM participant into a full displayable user, preferring the
    // real username we already have from listDms over whatever's cached
    // (addCachedUser seeds a placeholder using the logged-in user's own
    // color/font until the real fetch resolves, so this avoids a flash of
    // the wrong name)
    const resolveDisplayUser = (id: string, knownUsername?: string): PublicUser | null => {
        const cached = cachedUsers.find((u) => u.id === id);
        if (!cached) return null;

        return knownUsername ? { ...cached, username: knownUsername } : cached;
    };

    const activeDmEntry = dms.find((d) => d.otherUser?.id === userId);
    const activeOtherUser = userId ? resolveDisplayUser(userId, activeDmEntry?.otherUser?.username) : null;

    const memoizedMessages = useMemo(() => messages, [messages.length, messages.map((m) => m.id).join(",")]);

    return (
        <div className={styles.container}>
            <div className={styles.dmList}>
                <div className={styles.dmListHeader}>
                    <span>Direct Messages</span>

                    <Link to="/chat" className={styles.backToChatLink}>
                        <i className="fas fa-comments" /> Chat
                    </Link>
                </div>

                <div className={styles.dmListScroller}>
                    {!loadingDms && dms.length === 0 && (
                        <div className={styles.status}>No conversations yet. Visit someone's profile and click Direct Message to start one.</div>
                    )}

                    {dms.map((dm) => {
                        if (!dm.otherUser) return null;

                        const displayUser = resolveDisplayUser(dm.otherUser.id, dm.otherUser.username);

                        return (
                            <div
                                key={dm.roomId}
                                className={styles.dmListItem}
                                data-active={dm.roomId === room && dm.otherUser.id === userId}
                                onClick={() => navigate(`/direct-messages/${dm.otherUser!.id}`)}
                            >
                                <Blook
                                    src={getUserAvatarPath((displayUser ?? dm.otherUser) as any)}
                                    shiny={dm.otherUser.avatar?.shiny}
                                    className={styles.dmAvatar}
                                />

                                {displayUser
                                    ? <Username user={displayUser} className={styles.dmUsername} />
                                    : <span className={styles.dmUsername}>{dm.otherUser.username}</span>
                                }

                                {unreadDmUserIds.includes(dm.otherUser.id) && <div className={styles.dmUnreadDot} />}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={styles.dmChat}>
                {!userId && <div className={styles.status}>Select a conversation to start messaging, or visit someone's profile to start a new one.</div>}

                {userId && (
                    <>
                        <div className={styles.dmChatHeader}>
                            <i
                                className={`fas fa-arrow-left ${styles.dmBackIcon}`}
                                onClick={() => navigate("/direct-messages")}
                            />

                            {activeOtherUser ? (
                                <>
                                    <Blook
                                        src={getUserAvatarPath(activeOtherUser)}
                                        shiny={activeOtherUser.avatar?.shiny}
                                        className={styles.dmChatHeaderAvatar}
                                    />
                                    <Username user={activeOtherUser} />
                                </>
                            ) : (
                                <span className={styles.dmUsername}>{activeDmEntry?.otherUser?.username ?? "Loading..."}</span>
                            )}
                        </div>

                        <ChatMessagesContainer aboveInput={false}>
                            {memoizedMessages.map((message, index) => {
                                const prevMessage = memoizedMessages[index + 1];
                                const isNewUser = !prevMessage || prevMessage.authorId !== message.authorId;

                                return <ChatMessage
                                    key={message.id}
                                    message={message}
                                    newUser={isNewUser}
                                    mentionsMe={false}
                                    isSending={message.nonce !== undefined}
                                    isEditing={false}
                                />;
                            })}
                        </ChatMessagesContainer>

                        <InputContainer placeholder={`Message ${activeOtherUser?.username ?? activeDmEntry?.otherUser?.username ?? ""}`} maxLength={2048} />
                    </>
                )}
            </div>
        </div>
    );
}

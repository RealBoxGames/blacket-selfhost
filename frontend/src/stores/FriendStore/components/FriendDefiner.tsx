import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@stores/SocketStore/index";
import { useUser } from "@stores/UserStore/index";
import { useFriend } from "@stores/FriendStore/index";
import { useToast } from "@stores/ToastStore/index";

import { SocketFriendsEntity, SocketMessageType } from "@blacket/types";

export default function FriendDefiner() {
    const { connected, socket } = useSocket();
    const { user, getUserAvatarPath } = useUser();
    const { addRequest, removeFriend, removeRequest, isFriendsWith } = useFriend();
    const { createToast } = useToast();
    const navigate = useNavigate();

    const onFriendRequestReceived = async (data: SocketFriendsEntity) => {
        if (!data) return;

        addRequest(data);

        const nowIsFriends = isFriendsWith(data.id);

        if (!nowIsFriends) createToast({
            header: data.username,
            body: "has sent you a friend request.",
            icon: getUserAvatarPath(data),
            onClick: () => navigate(`/dashboard?name=${data.username}`)
        });
        else createToast({
            header: data.username,
            body: "has accepted your friend request.",
            icon: getUserAvatarPath(data),
            onClick: () => navigate(`/dashboard?name=${data.username}`)
        });
    };

    const onFriendRequestDeclined = (data: SocketFriendsEntity) => {
        if (!data) return;

        removeRequest(data.id);
        removeFriend(data.id);
    };

    const onFriendRequestRemoved = (data: SocketFriendsEntity) => {
        if (!data) return;

        removeRequest(data.id);
        removeFriend(data.id);
    };

    const onFriendRemoved = (data: SocketFriendsEntity) => {
        if (!data) return;

        removeRequest(data.id);
        removeFriend(data.id);
    };

    useEffect(() => {
        if (!connected || !user || !socket) return;

        socket.on(SocketMessageType.FRIENDS_REQUEST_RECEIVED, onFriendRequestReceived);
        socket.on(SocketMessageType.FRIENDS_REQUEST_DECLINED, onFriendRequestDeclined);
        socket.on(SocketMessageType.FRIENDS_REQUEST_REMOVED, onFriendRequestRemoved);
        socket.on(SocketMessageType.FRIENDS_REMOVED, onFriendRemoved);

        return () => {
            socket.off(SocketMessageType.FRIENDS_REQUEST_RECEIVED, onFriendRequestReceived);
            socket.off(SocketMessageType.FRIENDS_REQUEST_DECLINED, onFriendRequestDeclined);
            socket.off(SocketMessageType.FRIENDS_REQUEST_REMOVED, onFriendRequestRemoved);
            socket.off(SocketMessageType.FRIENDS_REMOVED, onFriendRemoved);
        };
    }, [connected, user, socket]);

    return null;
}

import { useEffect, useMemo, useState } from "react";
import { AutoSizer, List } from "react-virtualized";
import { useFriend } from "@stores/FriendStore/index";
import { useUser } from "@stores/UserStore/index";
import { Blook, Title, Username } from "@components/index";
import { StatButton } from ".";
import styles from "../dashboard.module.scss";

import { FriendsContainerProps, FriendsViewMode } from "../dashboard.d";
import { PublicUser } from "@blacket/types";

export default function FriendsContainer({ isMobile = false, onFriendClick }: FriendsContainerProps) {
    const [mode, setMode] = useState<FriendsViewMode>(FriendsViewMode.ALL);
    const [allFriends, setAllFriends] = useState<PublicUser[]>([]);
    const [friendRequests, setFriendRequests] = useState<PublicUser[]>([]);
    const [sendingRequests, setSendingRequests] = useState<PublicUser[]>([]);

    const { getAllFriends, getFriendRequests, getSendingRequests, friends, friendedBy, blocked } = useFriend();
    const { user, getUserAvatarPath, getUserBannerPath, isAvatarBig } = useUser();

    const rowHeight = useMemo(() => {
        if (isMobile) return 90;

        const vh = window.innerHeight / 100;

        return Math.max(60, vh * 8);
    }, []);

    useEffect(() => {
        setAllFriends(getAllFriends());
        setFriendRequests(getFriendRequests());
        setSendingRequests(getSendingRequests());
    }, [user, getAllFriends, getFriendRequests, getSendingRequests, friends, friendedBy, blocked]);

    const renderFriends = (friends: PublicUser[]) => {
        return <AutoSizer>
            {({ height, width }) => (
                <List
                    width={width}
                    height={height}
                    rowHeight={rowHeight}
                    rowRenderer={({ index, key, style }) => {
                        const friend = friends[index];

                        return (
                            <div
                                className={styles.friend}
                                key={key}
                                style={style}
                                onClick={() => {
                                    if (onFriendClick) onFriendClick(friend);
                                }}
                            >
                                <div className={styles.friendAvatarContainer}>
                                    <Blook
                                        className={styles.friendAvatar}
                                        src={getUserAvatarPath(friend)}
                                        alt="Friend Avatar"
                                        draggable={false}
                                        custom={friend.customAvatar ? true : false}
                                        shiny={friend.avatar?.shiny}
                                        data-big={isAvatarBig(friend)}
                                    />
                                </div>
                                <div className={styles.friendBannerAndInfo}>
                                    <div className={styles.friendBanner}>
                                        <img
                                            src={getUserBannerPath(friend)}
                                            alt="Friend Banner"
                                            draggable={false}
                                        />
                                    </div>
                                    <Username className={styles.friendUsername} user={friend} />
                                    <Title title={friend.titleId} className={styles.friendTitle} />
                                </div>
                            </div>
                        );
                    }}
                    rowCount={friends.length}
                    style={{
                        outline: "none",
                        overflowX: "hidden"
                    }}
                />
            )}
        </AutoSizer>;
    };

    const renderFriendsHeader = () => <p className={styles.friendsHeader}>Friends</p>;

    const renderFriendsModeP = () => <p className={styles.friendsMode}>
        {mode === FriendsViewMode.ALL
            ? "All Friends"
            : mode === FriendsViewMode.REQUESTS
                ? "Incoming Requests"
                : "Outgoing Requests"
        }
    </p>;

    const renderFriendsViewModeButtons = () => <div className={styles.friendsViewModeButtons}>
        {mode !== FriendsViewMode.REQUESTS && <StatButton
            icon="fas fa-arrow-up"
            backgroundColor={isMobile ? "var(--secondary-color)" : undefined}
            onClick={() => setMode && setMode(FriendsViewMode.REQUESTS)}
        >
            Incoming

            <div className={styles.requestCount} style={{ display: friendRequests.length > 0 ? "flex" : "none" }}><div>{friendRequests.length}</div></div>
        </StatButton>}

        {mode !== FriendsViewMode.SENDING && <StatButton
            icon="fas fa-arrow-down"
            backgroundColor={isMobile ? "var(--secondary-color)" : undefined}
            onClick={() => setMode && setMode(FriendsViewMode.SENDING)}
        >
            Outgoing
        </StatButton>}

        {mode !== FriendsViewMode.ALL && <StatButton
            icon="fas fa-user"
            backgroundColor={isMobile ? "var(--secondary-color)" : undefined}
            onClick={() => setMode && setMode(FriendsViewMode.ALL)}
        >
            All
        </StatButton>}
    </div>;

    return (
        <div className={styles.friendsContainer}>
            <div className={styles.friendsTop}>
                {!isMobile && renderFriendsHeader()}

                {!isMobile && renderFriendsModeP()}

                {!isMobile && renderFriendsViewModeButtons()}
            </div>

            <div className={styles.holdFriends}>
                {(mode === FriendsViewMode.ALL && allFriends.length === 0) && <>You don't have any friends. Why don't you make some?</>}

                <div className={styles.holdFriendsList}>
                    {mode === FriendsViewMode.ALL && renderFriends(allFriends)}
                    {mode === FriendsViewMode.REQUESTS && renderFriends(friendRequests)}
                    {mode === FriendsViewMode.SENDING && renderFriends(sendingRequests)}
                </div>
            </div>

            {isMobile && renderFriendsViewModeButtons()}
        </div>
    );
}

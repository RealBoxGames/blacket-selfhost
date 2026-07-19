import { Link } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useFriend } from "@stores/FriendStore/index";
import { Blook, Username } from "@components/index";
import { SettingsContainer } from "..";
import styles from "./social.module.scss";

export default function Social() {
    const { getUserAvatarPath } = useUser();
    const { blocked } = useFriend();

    return (
        <SettingsContainer header={{ icon: "fas fa-ban", text: "Blocked" }}>
            {blocked.length === 0 && <div>You have not blocked any users.</div>}

            <div className={styles.blocksContainer}>
                {blocked.map((user) => (
                    <Link to={`/dashboard?name=${user.username}`} key={user.id} className={styles.blockedUser}>
                        <Blook
                            className={styles.blockedAvatar}
                            src={getUserAvatarPath(user)}
                        />

                        <Username user={user} />
                    </Link>
                ))}
            </div>
        </SettingsContainer>
    );
}

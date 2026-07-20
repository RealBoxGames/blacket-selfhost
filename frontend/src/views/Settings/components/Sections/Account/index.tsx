import { useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useLoading } from "@stores/LoadingStore/index";
import { useDiscordLink } from "@controllers/discord/useDiscordLink/index";
import { useSettings } from "@controllers/settings/useSettings/index";
import { Button, Modal } from "@components/index";
import { SettingsContainer, Divider } from "..";
import { PlanText, UpgradeButton, ChangeUsernameModal } from "./components/index";

import { SettingFriendRequestEnum } from "@blacket/types";

export default function Account() {
    const { user } = useUser();
    const { fontIdToName, subscriptions } = useData();
    const { createModal } = useModal();
    const { setLoading } = useLoading();

    const { changeSetting } = useSettings();
    const { getOAuthUrl } = useDiscordLink();

    const navigate = useNavigate();

    if (!user) return null;

    const currentSubscription = subscriptions.find((sub) =>
        user.subscriptions.some((userSub) =>
            userSub.subscriptionId === sub.id &&
            (!userSub.expiresAt || new Date(userSub.expiresAt) > new Date())
        )
    );

    const friendRequestsButton = () => {
        setLoading("Changing settings");
        changeSetting({
            key: "friendRequests",
            value: user.settings.friendRequests === SettingFriendRequestEnum.ON ? SettingFriendRequestEnum.MUTUAL : user.settings.friendRequests === SettingFriendRequestEnum.MUTUAL ? SettingFriendRequestEnum.OFF : user.settings.friendRequests === SettingFriendRequestEnum.OFF ? SettingFriendRequestEnum.ON : SettingFriendRequestEnum.ON
        })
            .then(() => setLoading(false))
            .catch(() => createModal(<Modal.ErrorModal>Failed to change settings.</Modal.ErrorModal>))
            .finally(() => setLoading(false));
    };

    const lowPerformanceModeButton = () => {
        setLoading("Changing settings");

        const newValue =
            user.settings.lowPerformanceMode === null ? false : user.settings.lowPerformanceMode === false ? true : null;

        changeSetting({
            key: "lowPerformanceMode",
            value: newValue
        })
            .then(() => setLoading(false))
            .catch(() => createModal(<Modal.ErrorModal>Failed to change settings.</Modal.ErrorModal>))
            .finally(() => setLoading(false));
    };

    const linkDiscordButton = () => {
        setLoading("Opening Discord");

        getOAuthUrl()
            .then((url) => {
                // TODO: make this a popup
                open(url, "_blank");
            })
            .catch((err: Fetch2Response) => {
                createModal(<Modal.ErrorModal>{err.data.message}</Modal.ErrorModal>);
            })
            .finally(() => setLoading(false));
    };

    return <>
        <SettingsContainer header={{ icon: "fas fa-user", text: "Account" }}>
            <div><b>ID:</b> {user.id}</div>
            <div><b>Username:</b> {user.username}</div>
            <div style={{ display: "inline-flex" }}>
                <b>Font: </b>
                <div style={{ fontFamily: fontIdToName(user.fontId), marginLeft: 7 }}>
                    {fontIdToName(user.fontId)}
                </div>
            </div>
            <div><b>Joined:</b> {`${new Date(user.createdAt).toLocaleDateString()} ${new Date(user.createdAt).toLocaleTimeString()}`}</div>
            {user.discord && <div><b>Discord:</b> {user.discord.username}</div>}

            <Divider margin={10} />

            <Button.ClearButton onClick={() => createModal(<ChangeUsernameModal />)}>Change Username</Button.ClearButton>
            <Button.ClearButton onClick={friendRequestsButton}>Friend Requests: {
                user.settings.friendRequests === SettingFriendRequestEnum.ON ? "On" : user.settings.friendRequests === SettingFriendRequestEnum.OFF ? "Off" : user.settings.friendRequests === SettingFriendRequestEnum.MUTUAL ? "Mutual" : "Unknown"
            }</Button.ClearButton>
            {!user.discord && <Button.ClearButton onClick={linkDiscordButton}>Link Discord</Button.ClearButton>}

            <Button.ClearButton onClick={() => createModal(<Modal.LogoutModal />)}>
                Logout
            </Button.ClearButton>
        </SettingsContainer>

        <SettingsContainer header={{ icon: "fas fa-wallet", text: "Plan" }}>
            <PlanText>{currentSubscription ? currentSubscription.name : "Basic"}</PlanText>

            <UpgradeButton>{currentSubscription ? "Switch Plans" : "Upgrade"}</UpgradeButton>

            <Divider margin={15} />

            <div style={{ marginTop: 5 }}>
                <Button.ClearButton onClick={() => navigate("/settings/billing")}>View Transaction History</Button.ClearButton>
            </div>
        </SettingsContainer>

        <SettingsContainer header={{ icon: "fas fa-cog", text: "General" }}>
            <Tooltip id="lowPerformanceMode" place="right">This will reduce some animations and visual effects to improve performance on lower-end devices.</Tooltip>
            <Button.ClearButton data-tooltip-id="lowPerformanceMode" onClick={lowPerformanceModeButton}>Low Performance Mode: {
                user.settings.lowPerformanceMode === null ? "Auto" : user.settings.lowPerformanceMode === false ? "Off" : user.settings.lowPerformanceMode === true ? "On" : "Auto"
            }</Button.ClearButton>

        </SettingsContainer>
    </>;
}

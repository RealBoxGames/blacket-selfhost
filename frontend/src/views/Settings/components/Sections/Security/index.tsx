import { useModal } from "@stores/ModalStore/index";
import { useUser } from "@stores/UserStore/index";
import { Button } from "@components/index";
import { ChangePasswordModal, DisableOTPModal, EnableOTPModal, ManageSecurityKeysModal } from "./components/index";
import { SettingsContainer } from "..";

export default function Security() {
    const { user } = useUser();
    const { createModal } = useModal();

    if (!user) return null;

    return (
        <SettingsContainer header={{ icon: "fas fa-lock", text: "Security" }}>
            <Button.ClearButton onClick={() => createModal(<ChangePasswordModal />)}>Change Password</Button.ClearButton>
            <Button.ClearButton onClick={() => createModal(user.settings.otpEnabled ? <DisableOTPModal /> : <EnableOTPModal />)}>{user.settings.otpEnabled ? "Disable" : "Enable"} 2FA / OTP</Button.ClearButton>
            <Button.ClearButton onClick={() => createModal(<ManageSecurityKeysModal />)}>Add Security Key</Button.ClearButton>
        </SettingsContainer>
    );
}

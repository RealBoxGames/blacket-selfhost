import { Link } from "react-router-dom";
import { SettingsContainer } from "..";

export default function Legal() {
    return (
        <SettingsContainer header={{ icon: "fas fa-info-circle", text: "Legal" }}>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/eula">End User License Agreement</Link>
            <Link to="/rules">Rules</Link>
        </SettingsContainer>
    );
}

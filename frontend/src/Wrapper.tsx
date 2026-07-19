import { ReactNode, memo } from "react";
import { ConfigLoader } from "@stores/ConfigStore/ConfigLoader";
import { DataLoader } from "@stores/DataStore/components/index";
import { LoadingUI } from "@stores/LoadingStore/components/index";
import { ModalUI } from "@stores/ModalStore/components/index";
import { ToastUI } from "@stores/ToastStore/components/index";
import { ContextMenuUI } from "@stores/ContextMenuStore/components/index";
import { InsanePullUI } from "@stores/InsanePullStore/components/index";
import { SocketDefiner } from "@stores/SocketStore/components/index";
import { ChatDefiner } from "@stores/ChatStore/components/index";
import { FriendDefiner } from "@stores/FriendStore/components/index";
import { SoundDefiner } from "@stores/SoundStore/components/index";
// import { useContextMenu } from "@stores/ContextMenuStore/index";

const StaticUI = memo(() => (
    <>
        <LoadingUI />
        <ModalUI />
        <ToastUI />
        <InsanePullUI />
    </>
));
StaticUI.displayName = "StaticUI";

const EventDefiners = memo(() => (
    <>
        <SocketDefiner />
        <ChatDefiner />
        <FriendDefiner />
    </>
));
EventDefiners.displayName = "EventDefiners";

export default function Wrapper({ children }: { children: ReactNode }) {
    return (
        <>
            <ConfigLoader>
                <DataLoader>
                    <StaticUI />
                    <ContextMenuUI />

                    {children}

                    <EventDefiners />
                </DataLoader>
            </ConfigLoader>

            <SoundDefiner />
        </>
    );
}

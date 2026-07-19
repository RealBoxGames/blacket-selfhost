import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLoading } from "@stores/LoadingStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useDiscordLink } from "@controllers/discord/useDiscordLink/index";
import { Modal } from "@components/index";

export default function SettingsLinkDiscord() {
    const { setLoading } = useLoading();
    const { createModal } = useModal();

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { linkDiscord } = useDiscordLink();

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    useEffect(() => {
        if (!code || !state) return navigate("/settings");

        setLoading("Linking Discord");

        linkDiscord({ code, state })
            .then(() => {
                navigate("/settings");
            })
            .catch((err: Fetch2Response) => {
                createModal(<Modal.ErrorModal onClick={() => navigate("/settings")}>{err.data.message}</Modal.ErrorModal>);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [code, state]);

    return null;
}


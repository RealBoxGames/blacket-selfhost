import { useEffect } from "react";
import { Modal } from "@components/index";
import { useModal } from "@stores/ModalStore/index";
import { localStorage } from "@functions/core/localStorage";

export function ModalUI() {
    const modals = useModal((s) => s.modals);
    const closing = useModal((s) => s.closing);
    const setClosing = useModal((s) => s.setClosing);

    useEffect(() => {
        if (modals.length > 0) document.body.style.overflow = "hidden";
        else document.body.style.removeProperty("overflow");
    }, [modals]);

    useEffect(() => {
        if (!closing) return;

        const timeout = setTimeout(() => {
            useModal.setState((s) => ({ modals: s.modals.slice(1) }));
            setClosing(false);
        }, 500);

        return () => clearTimeout(timeout);
    }, [closing]);

    if (modals[0]) return (
        <Modal.GenericModal
            closing={closing}
            noAnimation={!localStorage.get("settings:modalAnimation")}
            outside={modals[0].props?.outsideModal}
            fullscreen={modals[0].props?.fullscreen}
        >
            {modals[0].modal}
        </Modal.GenericModal>
    );
}

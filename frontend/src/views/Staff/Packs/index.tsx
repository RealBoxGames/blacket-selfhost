import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { Button } from "@components/index";
import styles from "../staff.module.scss";

import { Blook, Pack, PermissionTypeEnum } from "@blacket/types";

import { useListPacks } from "@controllers/staff/useListPacks";
import { useListBlooks } from "@controllers/staff/useListBlooks";
import PackEditModal from "./components/PackEditModal";

export default function PacksPage() {
    const { user } = useUser();
    const { createModal } = useModal();
    const { listPacks } = useListPacks();
    const { listBlooks } = useListBlooks();

    const [packs, setPacks] = useState<Pack[]>([]);
    const [allBlooks, setAllBlooks] = useState<Blook[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    if (!user || !user.hasPermission(PermissionTypeEnum.MANAGE_DATA)) return <Navigate to="/login" />;

    const refresh = () => {
        setLoading(true);

        listPacks()
            .then((res) => setPacks(res.data))
            .catch(() => setPacks([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refresh();
        listBlooks().then((res) => setAllBlooks(res.data)).catch(() => setAllBlooks([]));
    }, []);

    const openModal = (pack?: Pack) => {
        createModal(<PackEditModal
            pack={pack}
            allBlooks={allBlooks}
            onSaved={() => refresh()}
            onDeleted={() => refresh()}
        />);
    };

    return (
        <div className={styles.panelContainer}>
            <div className={styles.userManager}>
                <Button.GenericButton onClick={() => openModal()}>Create Pack</Button.GenericButton>

                {loading && <div className={styles.status}>Loading...</div>}
                {!loading && packs.length === 0 && <div className={styles.status}>No packs yet.</div>}

                <div className={styles.userList}>
                    {packs.map((pack) => (
                        <div key={pack.id} className={styles.userRow}>
                            <div className={styles.userInfo}>
                                <div className={styles.username}>{pack.name}</div>
                                <div className={styles.userStats}>
                                    {pack.price.toLocaleString()} tokens • {pack.enabled ? "Enabled" : "Disabled"} • {pack.blook?.length ?? 0} blooks
                                </div>
                            </div>

                            <Button.GenericButton onClick={() => openModal(pack)}>Edit</Button.GenericButton>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

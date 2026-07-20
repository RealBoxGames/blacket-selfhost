import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { SearchBox, Button } from "@components/index";
import styles from "../staff.module.scss";

import { Blook, Pack, PermissionTypeEnum, Rarity } from "@blacket/types";

import { useListBlooks } from "@controllers/staff/useListBlooks";
import { useListPacks } from "@controllers/staff/useListPacks";
import { useListRarities } from "@controllers/staff/useListRarities";
import BlookEditModal from "./components/BlookEditModal";

export default function BlooksPage() {
    const { user } = useUser();
    const { createModal } = useModal();
    const { listBlooks } = useListBlooks();
    const { listPacks } = useListPacks();
    const { listRarities } = useListRarities();

    const [search, setSearch] = useState<string>("");
    const [results, setResults] = useState<Blook[]>([]);
    const [rarities, setRarities] = useState<Rarity[]>([]);
    const [packs, setPacks] = useState<Pack[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    if (!user || !user.hasPermission(PermissionTypeEnum.MANAGE_DATA)) return <Navigate to="/login" />;

    useEffect(() => {
        listRarities().then((res) => setRarities(res.data)).catch(() => setRarities([]));
        listPacks().then((res) => setPacks(res.data)).catch(() => setPacks([]));
        doSearch();
    }, []);

    const doSearch = () => {
        setLoading(true);

        listBlooks(search)
            .then((res) => setResults(res.data))
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    };

    const openModal = (blook?: Blook) => {
        createModal(<BlookEditModal
            blook={blook}
            rarities={rarities}
            packs={packs}
            onSaved={(saved) => setResults((current) => {
                if (current.some((b) => b.id === saved.id)) return current.map((b) => (b.id === saved.id ? saved : b));
                return [saved, ...current];
            })}
            onDeleted={(id) => setResults((current) => current.filter((b) => b.id !== id))}
        />);
    };

    return (
        <div className={styles.panelContainer}>
            <div className={styles.userManager}>
                <SearchBox
                    placeholder="Search for a blook..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
                    buttons={[{ icon: "fas fa-search", tooltip: "Search", onClick: doSearch }]}
                />

                <Button.GenericButton onClick={() => openModal()}>Create Blook</Button.GenericButton>

                {loading && <div className={styles.status}>Loading...</div>}
                {!loading && results.length === 0 && <div className={styles.status}>No blooks loaded. Search above to get started.</div>}

                <div className={styles.userList}>
                    {results.map((blook) => (
                        <div key={blook.id} className={styles.userRow}>
                            <div className={styles.userInfo}>
                                <div className={styles.username}>{blook.name}</div>
                                <div className={styles.userStats}>
                                    {blook.price.toLocaleString()} tokens • {blook.chance}% chance • {rarities.find((r) => r.id === blook.rarityId)?.name ?? "Unknown rarity"}
                                </div>
                            </div>

                            <Button.GenericButton onClick={() => openModal(blook)}>Edit</Button.GenericButton>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { SearchBox, Button, Blook } from "@components/index";
import styles from "../staff.module.scss";

import { PermissionTypeEnum, StaffUserEntity } from "@blacket/types";

import { useSearchUsers } from "@controllers/staff/useSearchUsers";
import StaffEditUserModal from "../components/StaffEditUserModal";
import { isOwnerTier } from "@functions/staff/isOwnerTier";

export default function StaffUserManager() {
    const { user } = useUser();
    const { createModal } = useModal();
    const { searchUsers } = useSearchUsers();
    const { blooks } = useData();
    const { resourceIdToPath } = useResource();

    const [search, setSearch] = useState<string>("");
    const [results, setResults] = useState<StaffUserEntity[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    if (!user || !user.hasPermission(PermissionTypeEnum.MANAGE_DATA)) return <Navigate to="/login" />;

    const isSuperAdmin = isOwnerTier(user);

    const doSearch = () => {
        setLoading(true);

        searchUsers(search)
            .then((res) => setResults(res.data))
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    };

    const getAvatarSrc = (staffUser: StaffUserEntity) => {
        const blook = blooks.find((b) => b.id === staffUser.avatarBlookId);

        return blook ? resourceIdToPath(blook.imageId) : window.constructCDNUrl("/content/blooks/Default.png");
    };

    const openEditModal = (staffUser: StaffUserEntity) => {
        createModal(<StaffEditUserModal
            staffUser={staffUser}
            isSuperAdmin={isSuperAdmin}
            onUpdated={(updated) => setResults((current) => current.map((u) => (u.id === updated.id ? updated : u)))}
            onDeleted={(userId) => setResults((current) => current.filter((u) => u.id !== userId))}
        />);
    };

    return (
        <div className={styles.panelContainer}>
            <div className={styles.userManager}>
                <SearchBox
                    placeholder="Search for a user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
                    buttons={[{ icon: "fas fa-search", tooltip: "Search", onClick: doSearch }]}
                />

                {loading && <div className={styles.status}>Loading...</div>}
                {!loading && results.length === 0 && <div className={styles.status}>No users loaded. Search above to get started.</div>}

                <div className={styles.userList}>
                    {results.map((staffUser) => (
                        <div key={staffUser.id} className={styles.userRow}>
                            <Blook src={getAvatarSrc(staffUser)} shiny={staffUser.avatarShiny} className={styles.userAvatar} />

                            <div className={styles.userInfo}>
                                <div className={styles.username}>{staffUser.username}</div>
                                <div className={styles.userStats}>
                                    {staffUser.tokens.toLocaleString()} tokens • {staffUser.diamonds.toLocaleString()} diamonds • {staffUser.crystals.toLocaleString()} crystals
                                </div>
                                <div className={styles.userGroups}>
                                    {staffUser.groups.length > 0 ? staffUser.groups.map((g) => g.name).join(", ") : "No roles"}
                                </div>
                            </div>

                            <Button.GenericButton onClick={() => openEditModal(staffUser)}>Edit</Button.GenericButton>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { SearchBox, Button, Blook, Input, ErrorBoundary } from "@components/index";
import { useCheatsUsers } from "@controllers/cheats/useCheatsUsers";
import { useCheatsGive } from "@controllers/cheats/useCheatsGive";
import { useCheatsTriggerEvent } from "@controllers/cheats/useCheatsTriggerEvent";
import { useStaffGroups } from "@controllers/staff/useStaffGroups";
import styles from "./cheats.module.scss";

import { StaffUserEntity } from "@blacket/types";

type StaffGroup = { id: number; name: string; priority: number };

export default function Cheats() {
    return (
        <ErrorBoundary label="Cheats">
            <CheatsInner />
        </ErrorBoundary>
    );
}

function CheatsInner() {
    const { user, getUserAvatarPath } = useUser();
    const { blooks, resourceIdToPath } = useData();

    const { listUsers } = useCheatsUsers();
    const { give } = useCheatsGive();
    const { triggerEvent } = useCheatsTriggerEvent();
    const { getGroups } = useStaffGroups();

    const [search, setSearch] = useState<string>("");
    const [total, setTotal] = useState<number>(0);
    const [users, setUsers] = useState<StaffUserEntity[]>([]);
    const [groups, setGroups] = useState<StaffGroup[]>([]);
    const [selected, setSelected] = useState<StaffUserEntity | null>(null);
    const [status, setStatus] = useState<string>("");

    const [tokens, setTokens] = useState<string>("");
    const [diamonds, setDiamonds] = useState<string>("");
    const [crystals, setCrystals] = useState<string>("");
    const [experience, setExperience] = useState<string>("");
    const [blookQuery, setBlookQuery] = useState<string>("");
    const [shiny, setShiny] = useState<boolean>(false);
    const [groupId, setGroupId] = useState<number | null>(null);

    const [eventVisual, setEventVisual] = useState<"rgb" | "snow" | "none">("none");
    const [eventText, setEventText] = useState<string>("");
    const [eventDuration, setEventDuration] = useState<string>("8");

    const refreshUsers = (query?: string) => {
        listUsers(query)
            .then((res) => {
                setTotal(res.data.total);
                setUsers(res.data.users);
            })
            .catch(() => { });
    };

    useEffect(() => {
        if (!user || !user.isCheatsUser) return;

        refreshUsers();
        getGroups().then((res) => setGroups(res.data)).catch(() => setGroups([]));
    }, [user?.id]);

    if (!user) return <Navigate to="/login" />;
    if (!user.isCheatsUser) return <Navigate to="/dashboard" />;

    const doGive = () => {
        if (!selected) return;

        const blook = blookQuery ? blooks.find((b) => b.name.toLowerCase() === blookQuery.toLowerCase()) : undefined;
        if (blookQuery && !blook) return setStatus(`Could not find a blook named "${blookQuery}".`);

        setStatus("Giving...");

        give({
            targetUserId: selected.id,
            tokens: tokens ? Number(tokens) : undefined,
            diamonds: diamonds ? Number(diamonds) : undefined,
            crystals: crystals ? Number(crystals) : undefined,
            experience: experience ? Number(experience) : undefined,
            blookId: blook?.id,
            shiny: blook ? shiny : undefined,
            groupId: groupId ?? undefined
        })
            .then(() => {
                setStatus(`Gave ${selected.username} everything requested.`);
                setTokens(""); setDiamonds(""); setCrystals(""); setExperience(""); setBlookQuery(""); setShiny(false); setGroupId(null);
                refreshUsers(search);
            })
            .catch((err: Fetch2Response) => setStatus(err.data?.message ?? "Failed to give."));
    };

    const doTriggerEvent = () => {
        setStatus("Triggering event...");

        triggerEvent({
            visual: eventVisual,
            text: eventText || undefined,
            durationSeconds: eventDuration ? Number(eventDuration) : undefined
        })
            .then(() => setStatus("Event triggered."))
            .catch((err: Fetch2Response) => setStatus(err.data?.message ?? "Failed to trigger event."));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Cheats</h1>
                <div className={styles.totalUsers}>{total.toLocaleString()} registered accounts</div>
            </div>

            <div className={styles.columns}>
                <div className={styles.userColumn}>
                    <SearchBox
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); refreshUsers(e.target.value); }}
                    />

                    <div className={styles.userList}>
                        {users.map((u) => (
                            <div
                                key={u.id}
                                className={styles.userRow}
                                data-selected={selected?.id === u.id}
                                onClick={() => { setSelected(u); setStatus(""); }}
                            >
                                <Blook src={u.avatarBlookId ? resourceIdToPath(blooks.find((b) => b.id === u.avatarBlookId)?.imageId) : window.constructCDNUrl("/content/blooks/Default.png")} shiny={u.avatarShiny} className={styles.userAvatar} />

                                <div className={styles.userInfo}>
                                    <div className={styles.username}>{u.username}</div>
                                    <div className={styles.userStats}>
                                        {u.tokens.toLocaleString()} tokens • {u.diamonds.toLocaleString()} diamonds • {u.crystals.toLocaleString()} crystals
                                    </div>
                                    <div className={styles.userGroups}>{u.groups.length > 0 ? u.groups.map((g) => g.name).join(", ") : "No roles"}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.giveColumn}>
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>Give {selected ? `to ${selected.username}` : "(select a user)"}</div>

                        <div className={styles.giveGrid}>
                            <label>Tokens<Input value={tokens} onChange={(e) => setTokens(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="0" /></label>
                            <label>Diamonds<Input value={diamonds} onChange={(e) => setDiamonds(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="0" /></label>
                            <label>Crystals<Input value={crystals} onChange={(e) => setCrystals(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="0" /></label>
                            <label>Experience<Input value={experience} onChange={(e) => setExperience(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="0" /></label>
                        </div>

                        <div className={styles.giveGrid}>
                            <label>Blook Name<Input value={blookQuery} onChange={(e) => setBlookQuery(e.target.value)} placeholder="e.g. Default" /></label>
                            <label className={styles.checkboxLabel}><input type="checkbox" checked={shiny} onChange={(e) => setShiny(e.target.checked)} /> Shiny</label>
                        </div>

                        <div className={styles.giveGrid}>
                            <label>
                                Role
                                <select value={groupId ?? ""} onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)} className={styles.select}>
                                    <option value="">None</option>
                                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </label>
                        </div>

                        <Button.GenericButton onClick={doGive} disabled={!selected}>Give Everything Above</Button.GenericButton>
                    </div>

                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>Global Event</div>

                        <div className={styles.giveGrid}>
                            <label>
                                Visual
                                <select value={eventVisual} onChange={(e) => setEventVisual(e.target.value as any)} className={styles.select}>
                                    <option value="none">None</option>
                                    <option value="rgb">RGB Overlay</option>
                                    <option value="snow">Snow</option>
                                </select>
                            </label>
                            <label>Duration (seconds)<Input value={eventDuration} onChange={(e) => setEventDuration(e.target.value.replace(/[^0-9]/g, ""))} placeholder="8" /></label>
                        </div>

                        <Input value={eventText} onChange={(e) => setEventText(e.target.value)} placeholder="Announcement text (optional)" containerProps={{ style: { width: "100%" } }} />

                        <Button.GenericButton onClick={doTriggerEvent}>Trigger Event For Everyone</Button.GenericButton>
                    </div>

                    {status && <div className={styles.status}>{status}</div>}
                </div>
            </div>
        </div>
    );
}

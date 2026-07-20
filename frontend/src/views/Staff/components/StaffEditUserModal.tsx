import { useEffect, useState } from "react";
import { useModal } from "@stores/ModalStore/index";
import { useData } from "@stores/DataStore/index";
import { Modal, Input, Button, ErrorContainer, Dropdown, Toggle } from "@components/index";

import { StaffUserEntity } from "@blacket/types";

import { useEditUserCurrency } from "@controllers/staff/useEditUserCurrency";
import { useGiveUserBlook } from "@controllers/staff/useGiveUserBlook";
import { useSetUserAvatar } from "@controllers/staff/useSetUserAvatar";
import { useStaffGroups } from "@controllers/staff/useStaffGroups";
import { useEditUserGroups } from "@controllers/staff/useEditUserGroups";

type StaffGroup = { id: number; name: string; priority: number };

export default function StaffEditUserModal({ staffUser, isSuperAdmin, onUpdated }: {
    staffUser: StaffUserEntity;
    isSuperAdmin: boolean;
    onUpdated: (updated: StaffUserEntity) => void;
}) {
    const { closeModal } = useModal();
    const { blooks } = useData();

    const { editUserCurrency } = useEditUserCurrency();
    const { giveUserBlook } = useGiveUserBlook();
    const { setUserAvatar } = useSetUserAvatar();
    const { getGroups } = useStaffGroups();
    const { editUserGroups } = useEditUserGroups();

    const [error, setError] = useState<string>("");

    const [tokens, setTokens] = useState<number>(staffUser.tokens);
    const [diamonds, setDiamonds] = useState<number>(staffUser.diamonds);
    const [crystals, setCrystals] = useState<number>(staffUser.crystals);
    const [currencyLoading, setCurrencyLoading] = useState<boolean>(false);

    const blookOptions = blooks.map((blook) => ({ label: blook.name, value: blook.id }));

    const [blookId, setBlookId] = useState<number | null>(null);
    const [shiny, setShiny] = useState<boolean>(false);
    const [giveLoading, setGiveLoading] = useState<boolean>(false);

    const [avatarBlookId, setAvatarBlookId] = useState<number | null>(null);
    const [avatarShiny, setAvatarShiny] = useState<boolean>(false);
    const [avatarLoading, setAvatarLoading] = useState<boolean>(false);

    const [groups, setGroups] = useState<StaffGroup[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>(staffUser.groups.map((g) => g.id));
    const [groupsLoading, setGroupsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!isSuperAdmin) return;

        getGroups().then((res) => setGroups(res.data)).catch(() => setGroups([]));
    }, [isSuperAdmin]);

    const saveCurrency = () => {
        setCurrencyLoading(true);
        setError("");

        editUserCurrency(staffUser.id, { tokens, diamonds, crystals })
            .then((res) => onUpdated(res.data))
            .catch((res) => setError(res.data?.message ?? "Failed to update currency."))
            .finally(() => setCurrencyLoading(false));
    };

    const giveBlook = () => {
        if (blookId === null) return setError("Pick a blook to give first.");

        setGiveLoading(true);
        setError("");

        giveUserBlook(staffUser.id, blookId, shiny)
            .then(() => alert(`Gave ${staffUser.username} the${shiny ? " shiny" : ""} ${blooks.find((b) => b.id === blookId)?.name}.`))
            .catch((res) => setError(res.data?.message ?? "Failed to give blook."))
            .finally(() => setGiveLoading(false));
    };

    const saveAvatar = () => {
        if (avatarBlookId === null) return setError("Pick a blook for the avatar first.");

        setAvatarLoading(true);
        setError("");

        setUserAvatar(staffUser.id, avatarBlookId, avatarShiny)
            .then((res) => onUpdated(res.data))
            .catch((res) => setError(res.data?.message ?? "Failed to set avatar."))
            .finally(() => setAvatarLoading(false));
    };

    const toggleGroup = (id: number) => {
        setSelectedGroupIds((current) => current.includes(id) ? current.filter((g) => g !== id) : [...current, id]);
    };

    const saveGroups = () => {
        setGroupsLoading(true);
        setError("");

        editUserGroups(staffUser.id, selectedGroupIds)
            .then((res) => onUpdated(res.data))
            .catch((res) => setError(res.data?.message ?? "Failed to update roles."))
            .finally(() => setGroupsLoading(false));
    };

    return (
        <>
            <Modal.ModalHeader>Edit {staffUser.username}</Modal.ModalHeader>

            <Modal.ModalBody>
                <div style={{ fontWeight: "bold", marginBottom: 5 }}>Currency</div>

                <Input type="number" placeholder="Tokens" value={tokens} onChange={(e) => setTokens(Number(e.target.value))} />
                <Input type="number" placeholder="Diamonds" value={diamonds} onChange={(e) => setDiamonds(Number(e.target.value))} />
                <Input type="number" placeholder="Crystals" value={crystals} onChange={(e) => setCrystals(Number(e.target.value))} />
            </Modal.ModalBody>

            <Modal.ModalButtonContainer loading={currencyLoading}>
                <Button.GenericButton onClick={saveCurrency}>Save Currency</Button.GenericButton>
            </Modal.ModalButtonContainer>

            <Modal.ModalBody>
                <div style={{ fontWeight: "bold", marginBottom: 5 }}>Give Blook</div>

                <Dropdown options={blookOptions} onChange={(value) => setBlookId(value)} />
                <Toggle checked={shiny} onClick={() => setShiny((s) => !s)}>Shiny</Toggle>
            </Modal.ModalBody>

            <Modal.ModalButtonContainer loading={giveLoading}>
                <Button.GenericButton onClick={giveBlook}>Give Blook</Button.GenericButton>
            </Modal.ModalButtonContainer>

            <Modal.ModalBody>
                <div style={{ fontWeight: "bold", marginBottom: 5 }}>Set Avatar (PFP)</div>

                <Dropdown options={blookOptions} onChange={(value) => setAvatarBlookId(value)} />
                <Toggle checked={avatarShiny} onClick={() => setAvatarShiny((s) => !s)}>Shiny</Toggle>
            </Modal.ModalBody>

            <Modal.ModalButtonContainer loading={avatarLoading}>
                <Button.GenericButton onClick={saveAvatar}>Set Avatar</Button.GenericButton>
            </Modal.ModalButtonContainer>

            {isSuperAdmin && <>
                <Modal.ModalBody>
                    <div style={{ fontWeight: "bold", marginBottom: 5 }}>Roles</div>

                    {groups.map((group) => <Toggle key={group.id} checked={selectedGroupIds.includes(group.id)} onClick={() => toggleGroup(group.id)}>{group.name}</Toggle>)}
                </Modal.ModalBody>

                <Modal.ModalButtonContainer loading={groupsLoading}>
                    <Button.GenericButton onClick={saveGroups}>Save Roles</Button.GenericButton>
                </Modal.ModalButtonContainer>
            </>}

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer>
                <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}

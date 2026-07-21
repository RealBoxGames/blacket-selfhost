import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoading } from "@stores/LoadingStore/index";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { useModal } from "@stores/ModalStore/index";
import { SearchBox, Modal } from "@components/index";
import { Banner } from ".";
import { useChangeBanner } from "@controllers/cosmetics/useChangeBanner/index";
import styles from "../cosmeticsModal.module.scss";

import { PermissionTypeEnum } from "@blacket/types";

export default function BannerCategory() {
    const { user, getUserBannerPath } = useUser();

    const [search, setSearch] = useState<string>("");

    const { setLoading } = useLoading();
    const { banners } = useData();
    const { closeModal, createModal } = useModal();

    const { changeBanner, changeBannerUrl } = useChangeBanner();

    const navigate = useNavigate();

    if (!user) return null;

    const onSelect = (id: number) => {
        setLoading(true);

        changeBanner({ bannerId: id })
            .then(() => setLoading(false))
            .catch(() => setLoading(false));
    };

    const openUrlModal = () => {
        if (!user.hasPermission(PermissionTypeEnum.CUSTOM_AVATAR)) return closeModal(), navigate("/store");

        createModal(<Modal.ImageUrlModal
            title="Set Banner from URL"
            onSubmit={(url) => {
                setLoading(true);

                return changeBannerUrl({ url }).finally(() => setLoading(false));
            }}
        />);
    };

    return (
        <>
            <SearchBox
                placeholder="Search for a banner..."
                onChange={(e) => setSearch(e.target.value)}
                containerProps={{
                    style: { padding: "unset", margin: "unset", width: "100%", marginBottom: "10px", boxShadow: "unset" }
                }}
            />

            <div className={styles.holder} data-column={true}>
                <div className={styles.bannerContainer} onClick={openUrlModal}>
                    <img className={styles.bannerImage} src={(user.customBanner || user.customBannerUrl) ? getUserBannerPath(user) : window.constructCDNUrl("/content/icons/upload-banner.png")} />
                    <div className={styles.bannerName}>Set from URL</div>
                </div>

                <Banner banner={banners.find((banner) => banner.id === 1)!} onClick={() => onSelect(1)} />

                {banners
                    .filter((banner) => banner.name.toLowerCase().includes(search.toLowerCase()))
                    .sort((a, b) => a.priority - b.priority)
                    .map((banner) => (user.banners as number[]).includes(banner.id) && <Banner key={banner.id} banner={banner} onClick={() => onSelect(banner.id)} />)
                }
            </div>
        </>
    );
}

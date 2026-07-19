import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Title, UpdatedAt, Section } from "./components";
import styles from "./legal.module.scss";

import { LegalObject } from "./legal.d";

export default function Legal() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const [terms, setTerms] = useState<LegalObject | null>(null);
    const [privacy, setPrivacy] = useState<LegalObject | null>(null);
    const [eula, setEula] = useState<LegalObject | null>(null);

    const location = useLocation();
    const navigate = useNavigate();
    const hasScrolledOnLoad = useRef<boolean>(false);

    useEffect(() => {
        Promise.all([
            fetch(window.constructCDNUrl("/terms.json"))
                .then((res) => res.json())
                .then((data) => setTerms(data))
                .catch(() => setError("Something went wrong.")),
            fetch(window.constructCDNUrl("/privacy.json"))
                .then((res) => res.json())
                .then((data) => setPrivacy(data))
                .catch(() => setError("Something went wrong.")),
            fetch(window.constructCDNUrl("/eula.json"))
                .then((res) => res.json())
                .then((data) => setEula(data))
                .catch(() => setError("Something went wrong."))
        ])
            .finally(() => setLoading(false));
    }, []);

    const updatePathBasedOnScroll = useCallback(() => {
        const sections = [
            { id: "terms", path: "/terms" },
            { id: "privacy", path: "/privacy" },
            { id: "eula", path: "/eula" }
        ];

        let currentSection = "";

        sections.forEach(({ id }) => {
            const element = document.getElementById(id);

            if (element) {
                const rect = element.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) currentSection = id;
            }
        });

        if (!currentSection) return navigate("/legal", { replace: true });
        if (currentSection) {
            const targetPath = sections.find((s) => s.id === currentSection)?.path;

            if (targetPath && location.pathname !== targetPath) navigate(targetPath, { replace: true });
        }
    }, [location.pathname, navigate]);

    useEffect(() => {
        const handleHashChange = () => {
            if (loading || hasScrolledOnLoad.current) return;

            let hash = window.location.hash;
            if (!hash) {
                switch (location.pathname) {
                    case "/terms":
                        hash = "#terms";
                        break;
                    case "/privacy":
                        hash = "#privacy";
                        break;
                    case "/eula":
                        hash = "#eula";
                        break;
                    default:
                        hash = "";
                }
            }

            if (hash) {
                const element = document.querySelector(hash);
                if (element) element.scrollIntoView({ behavior: "smooth" });
            }

            hasScrolledOnLoad.current = true;
        };

        window.addEventListener("hashchange", handleHashChange);
        handleHashChange();

        return () => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, [loading, location.pathname]);

    useEffect(() => {
        if (loading) return;

        let throttleTimer: number | null = null;

        const handleScroll = () => {
            if (throttleTimer) return;

            throttleTimer = window.setTimeout(() => {
                updatePathBasedOnScroll();

                throttleTimer = null;
            }, 100);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        setTimeout(updatePathBasedOnScroll, 100);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, [loading, updatePathBasedOnScroll]);

    return (
        <div className={styles.containerContainer}>
            <div className={styles.container}>
                {!error && terms && privacy && eula ? <>
                    <div id="terms">
                        <Title>TERMS OF SERVICE</Title>
                        <UpdatedAt date={terms.updatedAt} />

                        <div style={{ marginTop: 20 }}>
                            {terms.sections.map((section, index) => <Section key={index} title={section.title}>{section.content}</Section>)}
                        </div>
                    </div>

                    <div id="privacy">
                        <Title>PRIVACY POLICY</Title>
                        <UpdatedAt date={privacy.updatedAt} />

                        <div style={{ marginTop: 20 }}>
                            {privacy.sections.map((section, index) => <Section key={index} title={section.title}>{section.content}</Section>)}
                        </div>
                    </div>

                    <div id="eula">
                        <Title>END USER LICENSE AGREEMENT</Title>
                        <UpdatedAt date={eula.updatedAt} />

                        <div style={{ marginTop: 20 }}>
                            {eula.sections.map((section, index) => <Section key={index} title={section.title}>{section.content}</Section>)}
                        </div>
                    </div>
                </> : error ? <h1>{error}</h1>
                    : loading && <h1>Loading...</h1>
                }
            </div>
        </div>
    );
}

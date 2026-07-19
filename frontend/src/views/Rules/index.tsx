import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useLoading } from "@stores/LoadingStore";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { Button } from "@components/index";
import { TooFastModal } from "./components/index";
import styles from "./rules.module.scss";

import { RuleObject } from "./rules.d";

export default function Rules() {
    const { setLoading } = useLoading();
    const { user } = useUser();
    const { createModal } = useModal();

    const [error, setError] = useState<string | null>(null);
    const [loadingRules, setLoadingRules] = useState<boolean>(true);

    const [startedReading] = useState<Date>(new Date());
    const [rules, setRules] = useState<RuleObject | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetch(window.constructCDNUrl("/rules.json"))
            .then((res) => res.json())
            .then((data) => setRules(data))
            .catch(() => setError("Something went wrong."))
            .finally(() => setLoadingRules(false));
    }, []);

    const agree = () => {
        setLoading(true);

        window.fetch2.patch("/api/users/read-rules", {})
            .then(() => navigate("/dashboard"))
            .finally(() => setLoading(false));
    };

    if (loadingRules) return "Loading...";
    else if (error) return error;
    else if (rules) return (
        <div className={styles.container}>
            <div className={styles.rulesContainer}>
                <h2>{rules.header}</h2>

                {rules.rules.map((rule, index) => <div key={index}>
                    <h1>{rule.name}</h1>
                    <ReactMarkdown>{rule.content}</ReactMarkdown>
                </div>)}

                {user && <>
                    <h2>{rules.footer}</h2>

                    <Button.ClearButton
                        className={styles.button}
                        onClick={() => {
                            const timeTaken = new Date().getTime() - startedReading.getTime();
                            if (timeTaken < (300 * 1000)) return createModal(<TooFastModal startedReading={startedReading} submitCallback={agree} />);

                            agree();
                        }}
                    >
                        I Agree
                    </Button.ClearButton>
                </>}
            </div>
        </div>
    );
}

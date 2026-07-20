import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { Button } from "@components/index";
import { Transaction } from "./components";
import { useTransactions } from "@controllers/users/useTransactions";
import { StripeSubscriptionEntity, Transaction as TransactionType } from "@blacket/types";
import styles from "./billing.module.scss";

export default function SettingsBilling() {
    const { user } = useUser();
    if (!user) return null;

    const { subscriptions } = useData();
    const { resourceIdToPath } = useResource();
    const { getTransactions } = useTransactions();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState<TransactionType[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
    const [subscription] = useState<StripeSubscriptionEntity | null>(() => {
        if (user.subscriptions.length > 0) {
            for (const sub of user.subscriptions) {
                const subscription = subscriptions.find((s) => s.id === sub.subscriptionId);
                if (subscription) return subscription;
            }
        }

        return null;
    });

    useEffect(() => {
        getTransactions()
            .then((res) => setTransactions(res.data));
    }, [user]);

    const switchPlan = () => {
        navigate("/store");
    }

    return (
        <div className={styles.container}>
            <div className={styles.planContainer} style={{
                background: subscription ? `
                    linear-gradient(135deg, ${subscription.color1} 0%, ${subscription.color2} 100%)`
                    : undefined
            }}>
                <div className={styles.planDetailsContainer}>
                    <img src={subscription ? resourceIdToPath(subscription.imageId) : window.constructCDNUrl("/content/logo.png")} className={styles.planLogo} />

                    <div className={styles.planDetails}>
                        <div className={styles.planName}>
                            {subscription ? subscription.name : `${import.meta.env.VITE_INFORMATION_NAME} Basic`}
                        </div>

                        <div className={styles.planDescription}>
                            {subscription ? subscription.shortDescription : "You are currently not subscribed to any plan."}
                        </div>
                    </div>
                </div>

                <div className={styles.planActions}>
                    <Button.ClearButton
                        onClick={switchPlan}
                    >
                        {subscription ? "Switch Plans" : "Get a Plan"}
                    </Button.ClearButton>
                </div>
            </div>

            <div className={styles.header}>
                Transaction History
            </div>

            <div className={styles.transactionHistoryContainer}>
                <div className={styles.transactionHistoryTopRow}>
                    <div className={styles.transactionHistoryDate}>Date</div>
                    <div className={styles.transactionHistoryDescription}>Description</div>
                    <div className={styles.transactionHistoryAmount}>Amount</div>
                </div>

                <div className={styles.transactionHistory}>
                    {/* <div className={styles.transaction} onClick={() => setSelectedTransaction(selectedTransaction ? null : {} as Transaction)}>
                        <Textfit className={styles.transactionDate} mode="single" min={0} max={16}>
                            06/08/2025
                        </Textfit>

                        <Textfit className={styles.transactionDescription} mode="single" min={0} max={16}>
                            Blacket Basic
                        </Textfit>

                        <Textfit className={styles.transactionAmount} mode="single" min={0} max={16}>
                            $99.99 USD
                        </Textfit>

                        <i className="fa-solid fa-chevron-down" />

                        {selectedTransaction && (
                            <div className={styles.transactionDetails}>
                                todo later
                            </div>
                        )}
                    </div> */}
                    {transactions.map((transaction) => (
                        <Transaction
                            key={transaction.id}
                            transaction={transaction}
                            selected={selectedTransaction?.id === transaction.id}
                            onClick={() => setSelectedTransaction(selectedTransaction?.id === transaction.id ? null : transaction)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

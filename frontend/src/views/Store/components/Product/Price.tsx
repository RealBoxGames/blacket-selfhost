import styles from "./product.module.scss";

import { PriceProps } from "../../store.d";

export default function Price({ price, discount, isPriceUsingCrystals, isSubPrice, strikethrough }: PriceProps) {
    const FINAL_PRICE = !discount ? price :
        (price * (1 - (discount / 100))).toFixed(isPriceUsingCrystals ? 0 : 2);

    return (
        <div className={isSubPrice ? styles.productSubPrice : styles.productPrice} style={strikethrough ? { textDecoration: "line-through" } : {}}>
            {isPriceUsingCrystals ? <>
                <img className={styles.productCurrencyImage} src={window.constructCDNUrl("/content/crystal.png")} />
                {FINAL_PRICE} Crystals
            </> : `$${FINAL_PRICE} USD`}
        </div>
    );
}

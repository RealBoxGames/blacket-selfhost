import styles from "./markdown.module.scss";

export default function Checkmark() {
    return (
        <span className={styles.checkmark}>
            <i className={"fas fa-check"} />
        </span>
    );
}

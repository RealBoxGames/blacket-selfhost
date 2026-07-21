import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { Post } from "./components";
import styles from "./news.module.scss";

import { NewsNewsPostEntity } from "@blacket/types";

export default function News() {
    const [news, setNews] = useState<NewsNewsPostEntity[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [failed, setFailed] = useState<boolean>(false);

    const { user } = useUser();

    if (!user) return <Navigate to="/login" />;

    const fetchNews = () => {
        setLoading(true);
        setFailed(false);

        window.fetch2.get("/api/news")
            .then((res) => setNews(res.data))
            .catch(() => setFailed(true))
            .finally(() => setLoading(false));
    };

    // the fetch had no .catch() before - a transient failure (e.g. mid
    // backend restart) left this page silently empty with no way to
    // recover without a full page reload
    useEffect(() => {
        fetchNews();
    }, []);

    if (failed) return (
        <div className={styles.posts}>
            <div>Failed to load news. <a href="#" onClick={(e) => { e.preventDefault(); fetchNews(); }}>Try again</a></div>
        </div>
    );

    if (loading) return <div className={styles.posts}>Loading...</div>;

    return (
        <>
            {<div className={styles.posts}>
                {news.map((post) => (
                    <Post
                        key={post.id}
                        post={post}
                    />
                ))}
            </div>}
        </>
    );
}

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { Input, Button, ErrorContainer } from "@components/index";
import styles from "../staff.module.scss";

import { PermissionTypeEnum } from "@blacket/types";

type NewsPost = { id: number; title: string; content: string; imageUrl?: string | null; createdAt: string };

export default function StaffNewsPage() {
    const { user } = useUser();

    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [creating, setCreating] = useState<boolean>(false);

    if (!user || !user.hasPermission(PermissionTypeEnum.MANAGE_DATA)) return <Navigate to="/login" />;

    const refresh = () => {
        setLoading(true);

        window.fetch2.get("/api/news")
            .then((res: Fetch2Response) => setPosts(res.data))
            .catch(() => setPosts([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refresh();
    }, []);

    const submit = () => {
        if (title.trim() === "" || content.trim() === "") return setError("Title and content are required.");

        setCreating(true);
        setError("");

        window.fetch2.post("/api/news", { title, content, imageUrl: imageUrl.trim() || undefined })
            .then(() => {
                setTitle("");
                setContent("");
                setImageUrl("");
                refresh();
            })
            .catch((res: Fetch2Response) => setError(res.data?.message ?? "Failed to create news post."))
            .finally(() => setCreating(false));
    };

    const remove = (id: number) => {
        window.fetch2.delete(`/api/news/${id}`, {})
            .then(() => setPosts((current) => current.filter((p) => p.id !== id)))
            .catch((res: Fetch2Response) => setError(res.data?.message ?? "Failed to delete news post."));
    };

    return (
        <div className={styles.panelContainer}>
            <div className={styles.userManager}>
                <div style={{ fontWeight: "bold", marginBottom: 5 }}>New Post</div>

                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} />
                <Input placeholder="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

                {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

                <Button.GenericButton onClick={submit}>{creating ? "Posting..." : "Post"}</Button.GenericButton>

                <div style={{ fontWeight: "bold", margin: "20px 0 5px" }}>Existing Posts</div>

                {loading && <div className={styles.status}>Loading...</div>}
                {!loading && posts.length === 0 && <div className={styles.status}>No news posts yet.</div>}

                <div className={styles.userList}>
                    {posts.map((post) => (
                        <div key={post.id} className={styles.userRow}>
                            <div className={styles.userInfo}>
                                <div className={styles.username}>{post.title}</div>
                                <div className={styles.userStats}>{post.content}</div>
                            </div>

                            <Button.GenericButton onClick={() => remove(post.id)}>Delete</Button.GenericButton>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import { useLoading } from "@stores/LoadingStore/index";
import Loader from "@components/Loader";

export function LoadingUI() {
    const { loading } = useLoading();

    return typeof loading === "string" ? <Loader message={`${loading}...`} /> : loading ? <Loader /> : null;
}

import { Background, Loader } from "@components/index";

import { LoadingProps } from "./loading.d";

export default function Loading({ error, children }: LoadingProps) {
    return (
        <>
            <Background />

            <Loader
                motionless={error ? true : false}
                message={children}
            />
        </>
    );
}

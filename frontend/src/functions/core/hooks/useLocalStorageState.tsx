import { useState, useEffect } from "react";
import { localStorage } from "@functions/core/localStorage";

export function useLocalStorageState<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(() => localStorage.get<T>(key, defaultValue) ?? defaultValue);

    useEffect(() => {
        localStorage.set<T>(key, value);
    }, [key, value]);

    return [value, setValue] as const;
}

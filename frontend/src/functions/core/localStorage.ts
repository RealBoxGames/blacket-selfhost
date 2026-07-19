const parseValue = <T>(raw: string | null, fallback?: T) => {
    if (raw === null) return fallback ?? null;

    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback ?? (raw as unknown as T);
    }
};

export const localStorage = {
    get: <T>(key: string, fallback?: T) => {
        try {
            return parseValue<T>(window.localStorage.getItem(key), fallback);
        } catch {
            return (fallback as T) ?? null;
        }
    },
    set: <T>(key: string, value: T) => {
        window.localStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key: string) => {
        window.localStorage.removeItem(key);
    }
};

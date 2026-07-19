export const formatDuration = (diff: number): string => {
    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 1) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours >= 1) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes >= 1) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
};

export const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    return formatDuration(diff);
};

export const formatTimePassed = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff <= 0) return "Just now";

    return formatDuration(diff);
};

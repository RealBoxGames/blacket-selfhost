export interface InsanePullStore {
    video: string | null;
    isPlaying: boolean;
    setVideo: (video: string | null) => void;
    setIsPlaying: (isPlaying: boolean) => void;
}

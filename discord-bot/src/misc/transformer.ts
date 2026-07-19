export function ResourcePathTransformer(path: string): string {
    return path.replace("{cdn}", "https://dev.blacket.org/media");
}

import { Resource } from "@blacket/types";

export interface ResourceStore {
    resources: Resource[];
    setResources: (resources: Resource[]) => void;
    getResourceById: (id: number) => Resource | undefined;
    resourceIdToPath: (id?: number | null) => string;
}

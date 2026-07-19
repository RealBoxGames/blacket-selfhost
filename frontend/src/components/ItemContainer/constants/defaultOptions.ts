import { ItemContainerOptions, SortField, SortDirection } from "../itemContainer.d";

export const DEFAULT_OPTIONS: ItemContainerOptions = {
    showItems: true,
    showBlooks: true,
    showShiny: true,
    showLocked: true,
    showPacks: true,
    rarities: undefined,
    searchQuery: undefined,
    sortBy: SortField.PRIORITY,
    sortDirection: SortDirection.ASCENDING,
    useVhStyles: false
};

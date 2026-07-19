import uFuzzy from '@leeoniya/ufuzzy';

const uf = new uFuzzy();

export function fuzzySearch(haystack: string[], needle: string): string[] {
	let ret = [];

    const idxs = uf.filter(haystack, needle);

	if (idxs != null && idxs.length > 0) {
		const infoThresh = 1e3;

		if (idxs.length <= infoThresh) {
			const info = uf.info(idxs, haystack, needle);

			const order = uf.sort(info, haystack, needle);

			for (let i = 0; i < Math.min(order.length, 25); i++) {
				ret.push(haystack[info.idx[order[i]]]);
			}
		}
	} else {
		ret = haystack.slice(0, 25);
	}

	return ret;
}
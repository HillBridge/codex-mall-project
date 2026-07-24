//#region src/index.ts
/**
* Compute the 64-bit FNV-1a hash of a string as two 32-bit lanes.
*
* This is the fast core: no BigInt, no allocations, plain `Math.imul`-free
* 32-bit arithmetic. Prefer {@link fnv1a64Hex} or {@link fnv1a64Base36} for a
* usable key; use this directly only when you want to avoid string formatting.
*
* The hash is computed over UTF-16 code units (`str.charCodeAt(i)`), not UTF-8
* bytes. For ASCII input this matches a canonical FNV-1a-64; for non-ASCII it
* does not. See the README for details.
*
* @param str - The string to hash.
* @returns The `{ high, low }` 32-bit lanes of the 64-bit hash.
*/
function fnv1a64(str) {
	let low = 2216829733;
	let high = 3421674724;
	for (let i = 0; i < str.length; i++) {
		low ^= str.charCodeAt(i);
		const lowByLow = (low & 65535) * 435;
		const highOfLow = (low >>> 16) * 435;
		const highByHigh = (high & 65535) * 435 + ((high >>> 16) * 435 << 16);
		const carry = (lowByLow >>> 16) + highOfLow;
		high = highByHigh + (carry >>> 16) + low * 256 >>> 0;
		low = (lowByLow & 65535 | (carry & 65535) << 16) >>> 0;
	}
	return {
		high: high >>> 0,
		low: low >>> 0
	};
}
/**
* Compute the 64-bit FNV-1a hash of a string as a `bigint`.
*
* Ergonomic and comparable, at the cost of composing the two lanes into a
* `bigint`. For a compact string key, prefer {@link fnv1a64Base36}.
*
* @param str - The string to hash.
* @returns The 64-bit hash as an unsigned `bigint`.
*/
function fnv1a64BigInt(str) {
	const { high, low } = fnv1a64(str);
	return BigInt(high) << 32n | BigInt(low);
}
/**
* Compute the 64-bit FNV-1a hash of a string as a 16-character zero-padded
* lowercase hex string.
*
* The output is always exactly 16 characters, so equal-length comparison and
* fixed-width storage are safe.
*
* @param str - The string to hash.
* @returns A 16-character hex string.
*/
function fnv1a64Hex(str) {
	const { high, low } = fnv1a64(str);
	return high.toString(16).padStart(8, "0") + low.toString(16).padStart(8, "0");
}
/**
* Compute the 64-bit FNV-1a hash of a string as a base36 string.
*
* This is the shortest textual form (up to 13 characters) and is ideal for
* cache keys. The length varies with the value; it is not zero-padded. Equal
* inputs always produce identical strings.
*
* @param str - The string to hash.
* @returns A base36 string of the 64-bit hash.
*/
function fnv1a64Base36(str) {
	return fnv1a64BigInt(str).toString(36);
}
//#endregion
export { fnv1a64, fnv1a64Base36, fnv1a64BigInt, fnv1a64Hex };

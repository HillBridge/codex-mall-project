//#region src/utils/crypto-token.ts
const HEX = "0123456789abcdef";
/**
* Generate a high-entropy, URL-safe (hex) random token suitable for use as a
* bearer credential — e.g. the persistent client auth token or an ephemeral
* remote-dock token. Defaults to 16 bytes (128 bits) of entropy.
*/
function randomToken(byteLength = 16) {
	const bytes = new Uint8Array(byteLength);
	globalThis.crypto.getRandomValues(bytes);
	let out = "";
	for (let i = 0; i < bytes.length; i++) out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 15];
	return out;
}
/**
* Generate a uniformly-distributed string of decimal digits using rejection
* sampling to avoid modulo bias. Intended for short, human-typed one-time
* codes (e.g. a 6-digit authentication code). Leading zeros are preserved.
*/
function randomDigits(length) {
	const limit = 250;
	const buf = /* @__PURE__ */ new Uint8Array(1);
	let out = "";
	while (out.length < length) {
		globalThis.crypto.getRandomValues(buf);
		if (buf[0] < limit) out += String(buf[0] % 10);
	}
	return out;
}
/**
* Constant-time string equality. Compares every character so the comparison
* time does not depend on the position of the first mismatch, mitigating
* timing side-channels when verifying secrets.
*
* Length is treated as public (it short-circuits on differing lengths), which
* is appropriate for fixed-length codes and tokens.
*/
function timingSafeEqual(a, b) {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return mismatch === 0;
}
//#endregion
//#region src/node/auth/revoke.ts
/**
* Flip `isTrusted` to false on any live WS clients connected with `token`
* and broadcast the `auth:revoked` event so they can react.
*
* Shared between persisted-auth revocation and remote-dock token revocation.
*/
async function revokeActiveConnectionsForToken(context, token) {
	const rpcHost = context.rpc;
	if (!rpcHost?._rpcGroup) return;
	const affectedSessionIds = /* @__PURE__ */ new Set();
	for (const client of rpcHost._rpcGroup.clients) if (client.$meta.clientAuthToken === token) {
		affectedSessionIds.add(client.$meta.id);
		client.$meta.isTrusted = false;
		client.$meta.clientAuthToken = void 0;
	}
	if (affectedSessionIds.size === 0) return;
	await rpcHost.broadcast({
		method: "devframe:auth:revoked",
		args: [],
		filter: (client) => affectedSessionIds.has(client.$meta.id)
	});
}
/**
* Revoke an auth token: remove from storage and notify all connected clients
* using this token that they are no longer trusted.
*/
async function revokeAuthToken(context, storage, token) {
	storage.mutate((state) => {
		delete state.trusted[token];
	});
	await revokeActiveConnectionsForToken(context, token);
}
//#endregion
export { timingSafeEqual as a, randomToken as i, revokeAuthToken as n, randomDigits as r, revokeActiveConnectionsForToken as t };

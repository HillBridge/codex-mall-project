import { R as SharedState, g as DevframeNodeRpcSession, h as DevframeNodeContext } from "./devframe-CpXy1ZlO.mjs";
import { v as RpcFunctionDefinitionAny } from "./types-oEqKqUC9.mjs";
import { n as InternalAnonymousAuthStorage } from "./context-DgkYTlXx.mjs";
import { Peer } from "crossws";

//#region src/node/auth/handler.d.ts
/**
 * A ready-made pre-auth RPC handler, as produced by
 * `devframe/recipes/interactive-auth`'s `createInteractiveAuth`. Bundles
 * everything a host adapter needs to wire an authenticated server:
 * the handshake RPC functions, the resolver gate, the connect-time trust
 * hook, and the startup banner.
 *
 * `startHttpAndWs` accepts one of these directly via its `auth` option —
 * see {@link https://devfra.me | devframe}'s server docs — or a host can
 * wire the four pieces itself against a lower-level transport.
 */
interface DevframeAuthHandler {
  /**
   * `anonymous:devframe:auth` + `anonymous:devframe:auth:exchange` (the
   * handshake) and `devframe:auth:revoke` (self-revoke) — register these on
   * the RPC host (e.g. `rpcHost.register(fn)` for each).
   */
  rpcFunctions: RpcFunctionDefinitionAny[];
  /**
   * Resolver gate: whether `methodName` is callable given `session`'s
   * current trust state. Defaults to allowing any `anonymous:`-prefixed
   * method (see `isAnonymousRpcMethod`) plus anything once the session is
   * trusted.
   */
  authorize: (methodName: string, session: DevframeNodeRpcSession) => boolean;
  /**
   * Connect-time trust: reads a bearer token off the peer's upgrade request
   * (an `Authorization: Bearer <token>` header, or a static/pre-shared
   * token from `clientAuthTokens`) and, when valid, marks the session
   * trusted immediately — before the client's own handshake call.
   */
  onConnect: (peer: Peer, session: DevframeNodeRpcSession) => void;
  /**
   * Print the current one-time code and its magic-link URL. Devframe stays
   * headless — call this yourself once the server is listening. Safe to
   * call repeatedly; it only prints once per code.
   */
  printBanner: () => void;
}
//#endregion
//#region src/node/auth/revoke.d.ts
/**
 * Flip `isTrusted` to false on any live WS clients connected with `token`
 * and broadcast the `auth:revoked` event so they can react.
 *
 * Shared between persisted-auth revocation and remote-dock token revocation.
 */
declare function revokeActiveConnectionsForToken(context: DevframeNodeContext, token: string): Promise<void>;
/**
 * Revoke an auth token: remove from storage and notify all connected clients
 * using this token that they are no longer trusted.
 */
declare function revokeAuthToken(context: DevframeNodeContext, storage: SharedState<InternalAnonymousAuthStorage>, token: string): Promise<void>;
//#endregion
//#region src/node/auth/state.d.ts
/**
 * The current one-time authentication code. Display this to the user (e.g. in
 * the dev-server terminal) so they can type it into the browser to authenticate.
 */
declare function getTempAuthCode(): string;
/**
 * Rotate the authentication code, resetting its expiry window and failed-attempt
 * counter. Call this when a new authentication flow begins (e.g. when an
 * untrusted client starts authenticating) so the displayed code is freshly
 * valid for its full TTL.
 */
declare function refreshTempAuthCode(): string;
/**
 * Build a "magic link" authentication URL that embeds a one-time code (OTP) as
 * a query parameter. Opening it authenticates the client without typing — print
 * it on startup (devframe stays headless, so the host prints its own banner).
 * Defaults to the current code; the link is subject to the same TTL.
 */
declare function buildOtpAuthUrl(baseUrl: string, code?: string): string;
/**
 * Re-authenticate a connection that presents a previously-issued bearer token.
 * Returns `true` and marks the session trusted when the token is known.
 *
 * Used by the `anonymous:devframe:auth` handler so a client that already
 * authenticated (token persisted in the browser) is trusted on reconnect
 * without entering the code again.
 */
declare function verifyAuthToken(token: string, session: DevframeNodeRpcSession, storage: SharedState<InternalAnonymousAuthStorage>): boolean;
/**
 * Exchange a one-time authentication code for a fresh, node-issued bearer token.
 *
 * On success this mints a high-entropy token, records it in the trusted store,
 * marks the calling session trusted, rotates the code, and returns the token
 * for the client to persist. Returns `null` on any failure.
 *
 * Because the code is short and human-typed, verification is hardened against
 * brute force: it enforces a time-to-live, compares in constant time, and
 * rotates the code after {@link TEMP_AUTH_MAX_ATTEMPTS} failed attempts so an
 * attacker cannot keep guessing against the same code.
 */
declare function exchangeTempAuthCode(code: string, session: DevframeNodeRpcSession, info: {
  ua: string;
  origin: string;
}, storage: SharedState<InternalAnonymousAuthStorage>): string | null;
//#endregion
export { verifyAuthToken as a, DevframeAuthHandler as c, refreshTempAuthCode as i, exchangeTempAuthCode as n, revokeActiveConnectionsForToken as o, getTempAuthCode as r, revokeAuthToken as s, buildOtpAuthUrl as t };
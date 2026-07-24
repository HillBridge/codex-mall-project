import { O as StreamReader, R as SharedState, Y as DevframeSettings, at as DevframeRpcServerFunctions, b as RpcSharedStateHost, et as ScopedServerFunctions, f as ConnectionMeta, it as DevframeRpcClientFunctions, k as StreamSink, nt as SettingsForNamespace, tt as ScopedSharedStates, xt as EventEmitter, y as RpcSharedStateGetOptions } from "../devframe-CpXy1ZlO.mjs";
import { _ as RpcFunctionDefinition, w as RpcFunctionsCollector } from "../types-oEqKqUC9.mjs";
import { C as RpcCacheManager, w as RpcCacheOptions } from "../index-DI_TMGjv.mjs";
import { t as WsRpcChannelOptions } from "../ws-client-nBjpin71.mjs";
import { BirpcOptions, BirpcReturn } from "birpc";

//#region src/client/rpc-streaming.d.ts
interface StreamingSubscribeOptions {
  /** Maximum buffered chunks before the oldest is dropped. Default 256. */
  highWaterMark?: number;
}
interface RpcStreamingClientHost {
  /**
   * Subscribe to a server-side stream by channel + id. Returns a reader
   * that's both an `AsyncIterable<T>` (`for await`) and exposes
   * `readable: ReadableStream<T>` for `pipeTo`-style consumption.
   */
  subscribe: <T = unknown>(channel: string, id: string, options?: StreamingSubscribeOptions) => StreamReader<T>;
  /**
   * Open the client side of a client-to-server upload. The id is
   * typically obtained from a prior action call that ran
   * `channel.openInbound()` on the server. Returns a `StreamSink<T>`
   * that mirrors the server-side producer surface (write / close /
   * error / writable / signal).
   *
   * The sink's `signal` aborts when the server cancels the upload.
   */
  upload: <T = unknown>(channel: string, id: string) => StreamSink<T>;
}
/**
 * Client-side streaming host. Mirrors `createRpcSharedStateClientHost`:
 * registers the two `:chunk` / `:end` event handlers once, then per-stream
 * state lives in a `Map<streamKey, StreamReader>`.
 */
declare function createRpcStreamingClientHost(rpc: DevframeRpcClient): RpcStreamingClientHost;
//#endregion
//#region src/client/scope.d.ts
type AnyRpcFn = (...args: any[]) => any;
/**
 * Client-side streaming host scoped to a namespace. Channel names are
 * auto-prefixed with `<namespace>:`.
 */
interface DevframeScopedClientStreamingHost {
  subscribe: <T = unknown>(channel: string, id: string, options?: StreamingSubscribeOptions) => StreamReader<T>;
  upload: <T = unknown>(channel: string, id: string) => StreamSink<T>;
}
/**
 * The scoped client RPC surface exposed on
 * `client.scope('my-plugin').rpc`. IDs and keys you pass are
 * auto-namespaced with `my-plugin:`.
 */
interface DevframeScopedClientRpc<NS extends string = string> {
  /** The namespace this surface is scoped to. */
  readonly namespace: NS;
  /**
   * Register a client (server→client) RPC function. The definition's
   * `name` must be bare (no `:`); it is stored as `<namespace>:<name>`.
   */
  register: (fn: RpcFunctionDefinition<string, any, any, any, any, any, DevframeRpcContext>) => void;
  /** Call a server RPC function. Bare names resolve within this namespace. */
  call: {
    <T extends keyof ScopedServerFunctions<NS> & string>(method: T, ...args: Parameters<Extract<ScopedServerFunctions<NS>[T], AnyRpcFn>>): Promise<Awaited<ReturnType<Extract<ScopedServerFunctions<NS>[T], AnyRpcFn>>>>;
    <T extends keyof DevframeRpcServerFunctions & string>(method: T, ...args: Parameters<Extract<DevframeRpcServerFunctions[T], AnyRpcFn>>): Promise<Awaited<ReturnType<Extract<DevframeRpcServerFunctions[T], AnyRpcFn>>>>;
    (method: string, ...args: any[]): Promise<any>;
  };
  /** Call a server RPC event (fire-and-forget). */
  callEvent: {
    <T extends keyof ScopedServerFunctions<NS> & string>(method: T, ...args: Parameters<Extract<ScopedServerFunctions<NS>[T], AnyRpcFn>>): void;
    <T extends keyof DevframeRpcServerFunctions & string>(method: T, ...args: Parameters<Extract<DevframeRpcServerFunctions[T], AnyRpcFn>>): void;
    (method: string, ...args: any[]): void;
  };
  /** Call an optional server RPC function (no error if unregistered). */
  callOptional: {
    <T extends keyof ScopedServerFunctions<NS> & string>(method: T, ...args: Parameters<Extract<ScopedServerFunctions<NS>[T], AnyRpcFn>>): Promise<Awaited<ReturnType<Extract<ScopedServerFunctions<NS>[T], AnyRpcFn>>> | undefined>;
    <T extends keyof DevframeRpcServerFunctions & string>(method: T, ...args: Parameters<Extract<DevframeRpcServerFunctions[T], AnyRpcFn>>): Promise<Awaited<ReturnType<Extract<DevframeRpcServerFunctions[T], AnyRpcFn>>> | undefined>;
    (method: string, ...args: any[]): Promise<any>;
  };
  /** Resolve a namespaced shared state. Bare keys resolve within this namespace. */
  sharedState: {
    <T extends keyof ScopedSharedStates<NS> & string>(key: T, options?: RpcSharedStateGetOptions<ScopedSharedStates<NS>[T]>): Promise<SharedState<ScopedSharedStates<NS>[T]>>;
    <T extends Record<string, any> = Record<string, any>>(key: string, options?: RpcSharedStateGetOptions<T>): Promise<SharedState<T>>;
  };
  /** Streaming host scoped to this namespace. */
  streaming: DevframeScopedClientStreamingHost;
}
/**
 * A namespace-scoped view of the {@link DevframeRpcClient}. Returned by
 * `client.scope('my-plugin')`. Replaces `rpc` with the auto-namespaced
 * surface and adds a top-level `settings` store.
 */
interface DevframeScopedClientContext<NS extends string = string, Settings extends Record<string, any> = Record<string, any>> {
  /** The namespace this context is scoped to. */
  readonly namespace: NS;
  /** The underlying unscoped client. */
  readonly base: DevframeRpcClient;
  rpc: DevframeScopedClientRpc<NS>;
  /** Persisted settings for this namespace (`global` + `project`). */
  settings: DevframeSettings<Settings>;
  /**
   * Return a new scoped client, replacing the current scope. Pass `null`
   * or `''` to un-scope and get the base client.
   */
  scope: DevframeRpcClient['scope'];
}
/**
 * Build a namespace-scoped view of a {@link DevframeRpcClient}. Every RPC
 * id, shared-state key, and streaming channel passed through the returned
 * `rpc` surface is auto-namespaced with `<namespace>:`.
 */
declare function createScopedClientContext<NS extends string = string>(rpc: DevframeRpcClient, namespace: NS): DevframeScopedClientContext<NS>;
//#endregion
//#region src/client/rpc.d.ts
interface DevframeRpcContext {
  /**
   * The RPC client to interact with the server
   */
  readonly rpc: DevframeRpcClient;
}
type DevframeClientRpcHost = RpcFunctionsCollector<DevframeRpcClientFunctions, DevframeRpcContext>;
interface RpcClientEvents {
  'rpc:is-trusted:updated': (isTrusted: boolean) => void;
}
interface DevframeRpcClientOptions {
  connectionMeta?: ConnectionMeta;
  baseURL?: string | string[];
  /**
   * The auth token to use for the client
   */
  authToken?: string;
  /**
   * Query-param name on the page URL carrying a one-time authentication code
   * (OTP) for "magic link" auth (e.g. a link the dev server prints). When
   * present, the client exchanges the code for a token and removes the parameter
   * from the URL. Set `false` to disable — e.g. integrations that drive their
   * own authentication via `authenticateWithUrlOtp`. Default: `'devframe_otp'`.
   */
  otpParam?: string | false;
  wsOptions?: Partial<WsRpcChannelOptions>;
  rpcOptions?: Partial<BirpcOptions<DevframeRpcServerFunctions, DevframeRpcClientFunctions, boolean>>;
  cacheOptions?: boolean | Partial<RpcCacheOptions>;
}
type DevframeRpcClientCall = BirpcReturn<DevframeRpcServerFunctions, DevframeRpcClientFunctions>['$call'];
type DevframeRpcClientCallEvent = BirpcReturn<DevframeRpcServerFunctions, DevframeRpcClientFunctions>['$callEvent'];
type DevframeRpcClientCallOptional = BirpcReturn<DevframeRpcServerFunctions, DevframeRpcClientFunctions>['$callOptional'];
interface DevframeRpcClient {
  /**
   * The events of the client
   */
  events: EventEmitter<RpcClientEvents>;
  /**
   * Whether the client is trusted
   */
  readonly isTrusted: boolean | null;
  /**
   * The connection meta
   */
  readonly connectionMeta: ConnectionMeta;
  /**
   * Return a promise that resolves when the client is trusted
   *
   * Rejects with an error if the timeout is reached
   *
   * @param timeout - The timeout in milliseconds, default to 60 seconds
   */
  ensureTrusted: (timeout?: number) => Promise<boolean>;
  /**
   * Request trust from the server
   */
  requestTrust: () => Promise<boolean>;
  /**
   * Request trust from the server using a previously-issued auth token.
   * Updates the stored token and re-requests trust without reloading the page.
   */
  requestTrustWithToken: (token: string) => Promise<boolean>;
  /**
   * Authenticate this client by exchanging a one-time code (shown by the dev
   * server) for a node-issued auth token. On success the token is persisted for
   * future reconnections and shared with sibling tabs. Resolves `true` when
   * authenticated.
   */
  requestTrustWithCode: (code: string) => Promise<boolean>;
  /**
   * Call a RPC function on the server
   */
  call: DevframeRpcClientCall;
  /**
   * Call a RPC event on the server, and does not expect a response
   */
  callEvent: DevframeRpcClientCallEvent;
  /**
   * Call a RPC optional function on the server
   */
  callOptional: DevframeRpcClientCallOptional;
  /**
   * The client RPC host
   */
  client: DevframeClientRpcHost;
  /**
   * The shared state host
   */
  sharedState: RpcSharedStateHost;
  /**
   * The streaming channel host. Subscribe to a server-side stream by
   * channel + id; the returned reader is both `AsyncIterable<T>` and
   * exposes `.readable: ReadableStream<T>` for `pipeTo` consumption.
   */
  streaming: RpcStreamingClientHost;
  /**
   * The RPC cache manager
   */
  cacheManager: RpcCacheManager;
  /**
   * Create a namespace-scoped view of this client. The returned
   * `client.scope('my-plugin')` auto-namespaces every RPC id,
   * shared-state key, and streaming channel with `my-plugin:`, and
   * exposes a typed top-level `settings` store. This is the preferred way
   * to consume the client from a single tool's UI code.
   *
   * Pass `null` or `''` to un-scope and get the base client.
   */
  scope: {
    <NS extends string>(namespace: NS): DevframeScopedClientContext<NS, SettingsForNamespace<NS>>;
    (namespace?: null | ''): DevframeRpcClient;
  };
}
interface DevframeRpcClientMode {
  readonly isTrusted: boolean;
  ensureTrusted: DevframeRpcClient['ensureTrusted'];
  requestTrust: DevframeRpcClient['requestTrust'];
  requestTrustWithToken: DevframeRpcClient['requestTrustWithToken'];
  /**
   * Exchange a one-time code for a node-issued token. Resolves the minted
   * token on success (for the caller to persist), or `null` on failure.
   */
  requestTrustWithCode: (code: string) => Promise<string | null>;
  call: DevframeRpcClient['call'];
  callEvent: DevframeRpcClient['callEvent'];
  callOptional: DevframeRpcClient['callOptional'];
}
declare function getDevframeRpcClient(options?: DevframeRpcClientOptions): Promise<DevframeRpcClient>;
//#endregion
//#region src/client/otp.d.ts
/**
 * Read a one-time authentication code (OTP) from the current page URL's query
 * string, without side effects. Returns `undefined` when the parameter is absent.
 */
declare function readOtpFromUrl(param?: string): string | undefined;
/**
 * Read the one-time code from the page URL and remove it from the address bar
 * (and the current history entry), so the single-use code isn't left in the
 * URL, browser history, or a `Referer`. Returns the code, or `undefined` when
 * absent.
 */
declare function consumeOtpFromUrl(param?: string): string | undefined;
/**
 * Consume a one-time code from the page URL (see {@link consumeOtpFromUrl}) and
 * exchange it for a token via the client. Resolves `true` when the client is
 * authenticated (already trusted, or the exchange succeeded), and `false` when
 * no code is present or the exchange failed.
 *
 * Higher-level integrations (e.g. Vite DevTools) that want to drive their own
 * authentication UI can disable `connectDevframe`'s built-in handling with
 * `otpParam: false` and call this — or {@link consumeOtpFromUrl} — themselves.
 */
declare function authenticateWithUrlOtp(rpc: Pick<DevframeRpcClient, 'isTrusted' | 'requestTrustWithCode'>, options?: {
  param?: string;
}): Promise<boolean>;
//#endregion
//#region src/client/settings.d.ts
/**
 * Build the client-side `settings` surface for a scope namespace. Mirrors
 * the node-side stores over the shared-state sync protocol.
 */
declare function createClientSettings<T extends Record<string, any> = Record<string, any>>(rpc: DevframeRpcClient, namespace: string): DevframeSettings<T>;
//#endregion
//#region src/client/index.d.ts
declare const connectDevframe: typeof getDevframeRpcClient;
//#endregion
export { DevframeClientRpcHost, DevframeRpcClient, DevframeRpcClientCall, DevframeRpcClientCallEvent, DevframeRpcClientCallOptional, DevframeRpcClientMode, DevframeRpcClientOptions, DevframeRpcContext, DevframeScopedClientContext, DevframeScopedClientRpc, DevframeScopedClientStreamingHost, RpcClientEvents, RpcStreamingClientHost, StreamingSubscribeOptions, authenticateWithUrlOtp, connectDevframe, consumeOtpFromUrl, createClientSettings, createRpcStreamingClientHost, createScopedClientContext, getDevframeRpcClient, readOtpFromUrl };
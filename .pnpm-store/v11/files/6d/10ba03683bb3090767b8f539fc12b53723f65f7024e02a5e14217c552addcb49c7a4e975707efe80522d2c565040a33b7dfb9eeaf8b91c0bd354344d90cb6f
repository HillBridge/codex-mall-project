import { _ as RpcFunctionDefinition } from "./types-oEqKqUC9.mjs";
import { S as RpcFunctionsCollectorBase } from "./index-DI_TMGjv.mjs";
import { t as DevframeNodeRpcSessionMeta } from "./ws-server-BUgJpdX4.mjs";
import { CAC } from "cac";
import { GenericSchema, InferOutput } from "valibot";
import { BirpcReturn } from "birpc";
import { Diagnostic, DiagnosticDefinition, defineDiagnostics } from "nostics";

//#region src/adapters/flags.d.ts
/**
 * Schema map for typed CLI flags. Keys are flag names in camelCase —
 * this matches CAC's parsed-flag output ( `--no-open` → `noOpen` ). Each
 * value is a valibot schema used to both (a) derive the CAC option type
 * when the flag is registered and (b) validate / coerce the parsed
 * value before it's forwarded to `setup(ctx, { flags })`.
 */
type CliFlagsSchema = Record<string, GenericSchema>;
/**
 * Identity helper that preserves the literal schema-map type — use this
 * so `InferCliFlags<typeof myFlags>` resolves to the right object shape.
 *
 * ```ts
 * const appFlags = defineCliFlags({
 *   depth: v.pipe(v.number(), v.integer()),
 *   config: v.optional(v.string()),
 * })
 *
 * defineDevframe({
 *   cli: { flags: appFlags },
 *   setup(ctx, info) {
 *     const flags = info.flags as InferCliFlags<typeof appFlags>
 *     flags.depth // number
 *     flags.config // string | undefined
 *   },
 * })
 * ```
 */
declare function defineCliFlags<T extends CliFlagsSchema>(flags: T): T;
/** Extract the parsed-output type from a {@link CliFlagsSchema}. */
type InferCliFlags<T extends CliFlagsSchema> = { [K in keyof T]: InferOutput<T[K]> };
/** Validate and coerce the raw cac-parsed bag against a {@link CliFlagsSchema}. */
declare function parseCliFlags(schema: CliFlagsSchema, raw: Record<string, unknown>): {
  flags: Record<string, unknown>;
  issues?: string[];
};
//#endregion
//#region src/types/events.d.ts
interface EventsMap {
  [event: string]: any;
}
interface EventUnsubscribe {
  (): void;
}
interface EventEmitter<Events extends EventsMap> {
  /**
   * Calls each of the listeners registered for a given event.
   *
   * ```js
   * ee.emit('tick', tickType, tickDuration)
   * ```
   *
   * @param event The event name.
   * @param args The arguments for listeners.
   */
  emit: <K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) => void;
  /**
   * Calls the listeners for a given event once and then removes the listener.
   *
   * @param event The event name.
   * @param args The arguments for listeners.
   */
  emitOnce: <K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) => void;
  /**
   * Event names in keys and arrays with listeners in values.
   *
   * @internal
   */
  _listeners: Partial<{ [E in keyof Events]: Events[E][] }>;
  /**
   * Add a listener for a given event.
   *
   * ```js
   * const unbind = ee.on('tick', (tickType, tickDuration) => {
   *   count += 1
   * })
   *
   * disable () {
   *   unbind()
   * }
   * ```
   *
   * @param event The event name.
   * @param cb The listener function.
   * @returns Unbind listener from event.
   */
  on: <K extends keyof Events>(event: K, cb: Events[K]) => EventUnsubscribe;
  /**
   * Add a listener for a given event once.
   *
   * ```js
   * const unbind = ee.once('tick', (tickType, tickDuration) => {
   *   count += 1
   * })
   *
   * disable () {
   *   unbind()
   * }
   * ```
   *
   * @param event The event name.
   * @param cb The listener function.
   * @returns Unbind listener from event.
   */
  once: <K extends keyof Events>(event: K, cb: Events[K]) => EventUnsubscribe;
}
//#endregion
//#region src/types/agent.d.ts
/**
 * Serializable description of an agent-exposed tool. This is the shape
 * returned by the agent host manifest and surfaced over the wire by
 * the `devframe:agent:list-tools` introspection RPC.
 *
 * @experimental The agent-native surface is experimental and may change
 * without a major version bump until it stabilizes.
 */
interface AgentTool {
  /** Stable identifier. For RPC-backed tools, matches the RPC name. */
  id: string;
  /** `'rpc'` when backed by a registered RPC function, `'tool'` when registered via `ctx.agent.registerTool()`. */
  kind: 'rpc' | 'tool';
  /** Display title (falls back to `id`). */
  title: string;
  /** Human-readable description shown to the agent. */
  description: string;
  /** Safety classification — drives MCP hint annotations downstream. */
  safety: 'read' | 'action' | 'destructive';
  /** Free-form tags for grouping/filtering. */
  tags?: readonly string[];
  /** Present for `kind === 'rpc'` — points to the RPC function name. */
  rpcName?: string;
  /** JSON Schema describing the input (positional args synthesized to an object). */
  inputSchema?: unknown;
  /** JSON Schema describing the output. */
  outputSchema?: unknown;
  /** Example invocations shown to agents. */
  examples?: readonly {
    args: unknown[];
    description?: string;
  }[];
}
/**
 * Input accepted by `DevframeAgentHost.registerTool()`. Handler is
 * stripped from the serializable `AgentTool` projection.
 *
 * @experimental
 */
interface AgentToolInput {
  id: string;
  title?: string;
  description: string;
  safety?: 'read' | 'action' | 'destructive';
  tags?: readonly string[];
  inputSchema?: unknown;
  outputSchema?: unknown;
  examples?: readonly {
    args: unknown[];
    description?: string;
  }[];
  /** Invoked when the tool is called. Receives args as provided by the caller. */
  handler: (args: any) => unknown | Promise<unknown>;
}
/**
 * Serializable description of an agent-readable resource. Resources
 * surface structured or textual snapshots of devframe state.
 *
 * @experimental
 */
interface AgentResource {
  id: string;
  /** URI used by MCP clients. Defaults to `devframe://resource/<id>`. */
  uri: string;
  name: string;
  description?: string;
  /** Defaults to `application/json`. */
  mimeType?: string;
}
/**
 * Input accepted by `DevframeAgentHost.registerResource()`.
 *
 * @experimental
 */
interface AgentResourceInput {
  id: string;
  name: string;
  description?: string;
  mimeType?: string;
  /** Optional URI override — if omitted, a `devframe://resource/<id>` URI is generated. */
  uri?: string;
  /** Snapshot reader. Called on each read. */
  read: () => Promise<AgentResourceContent> | AgentResourceContent;
}
/**
 * Payload returned by `AgentResourceInput.read`. Either `text` or `json` must be set.
 *
 * @experimental
 */
interface AgentResourceContent {
  text?: string;
  json?: unknown;
  /** Override the resource's declared mimeType for this read. */
  mimeType?: string;
}
/**
 * Unified view of the agent-exposed surface.
 *
 * @experimental
 */
interface AgentManifest {
  tools: readonly AgentTool[];
  resources: readonly AgentResource[];
}
/**
 * Handle returned by `registerTool` / `registerResource`.
 *
 * @experimental
 */
interface AgentHandle {
  unregister: () => void;
}
/**
 * Events emitted by `DevframeAgentHost`.
 *
 * @experimental
 */
interface DevframeAgentHostEvents {
  'agent:tool:registered': (tool: AgentTool) => void;
  'agent:tool:unregistered': (id: string) => void;
  'agent:resource:registered': (resource: AgentResource) => void;
  'agent:resource:unregistered': (id: string) => void;
  /**
   * Fires when the unified manifest changes — including when a new
   * RPC function with an `agent` field is registered on `ctx.rpc`.
   */
  'agent:manifest:changed': () => void;
}
/**
 * Host that aggregates the agent-exposed surface of a devtool: both
 * RPC functions flagged with `agent` and plugin-registered tools /
 * resources. Consumed by protocol adapters such as the devframe MCP
 * adapter.
 *
 * @experimental The agent-native surface is experimental and may change
 * without a major version bump until it stabilizes.
 */
interface DevframeAgentHost {
  readonly events: EventEmitter<DevframeAgentHostEvents>;
  /**
   * Register a tool not backed by an RPC function. Use this when you
   * want a plain agent action (e.g. a synthesized summary) that
   * shouldn't exist as a full RPC.
   */
  registerTool: (tool: AgentToolInput) => AgentHandle;
  /** Unregister a previously registered tool by id. */
  unregisterTool: (id: string) => boolean;
  /** Register a readable resource. */
  registerResource: (resource: AgentResourceInput) => AgentHandle;
  /** Unregister a previously registered resource by id. */
  unregisterResource: (id: string) => boolean;
  /**
   * Unified snapshot of agent-exposed surface: RPC functions with an
   * `agent` field (auto-discovered from `ctx.rpc.definitions`) plus
   * tools/resources registered on the host.
   */
  list: () => AgentManifest;
  /**
   * Invoke any tool by id. Routes to the underlying RPC handler for
   * `kind === 'rpc'`, or to the registered handler for `kind === 'tool'`.
   */
  invoke: (id: string, args: unknown) => Promise<unknown>;
  /** Read a resource by id. */
  read: (id: string) => Promise<AgentResourceContent>;
  /** Look up a tool by id (returns the serializable projection). */
  getTool: (id: string) => AgentTool | undefined;
  /** Look up a resource by id. */
  getResource: (id: string) => AgentResource | undefined;
}
//#endregion
//#region src/types/diagnostics.d.ts
/**
 * A diagnostics definition object built with `defineDiagnostics`. Typed as
 * `unknown` because each integration's definition has a distinct narrow shape
 * (e.g. specific code keys like `DF0001` / `MYP0001`), and TypeScript's mapped
 * types don't allow assigning a narrow-keyed result to a generically-keyed
 * one. The host stores them in a heterogeneous registry.
 */
type DevframeDiagnosticsDefinition = ReturnType<typeof defineDiagnostics<any, any>>;
/**
 * The shared diagnostics lookup exposed by the host. A `Proxy` that resolves
 * any registered code name to its `nostics` handle (a callable that builds
 * a diagnostic and routes it through registered reporters). Typed loosely
 * because it spans heterogeneous definitions registered by different
 * integrations.
 */
type DevframeDiagnosticsLogger = Record<string, any>;
/**
 * Options accepted by the host's `defineDiagnostics()` factory — mirrors
 * `nostics`'s shape but the host pre-wires its ANSI console reporter, so
 * plugins typically omit `reporters`.
 */
interface DevframeDefineDiagnosticsOptions<Codes extends Record<string, DiagnosticDefinition>> {
  docsBase?: string | ((code: keyof Codes) => string | undefined);
  codes: Codes;
  reporters?: ReadonlyArray<(d: Diagnostic, o?: any) => void>;
}
/**
 * Host for structured diagnostics — a thin layer over `nostics` that lets
 * integrations register their own coded errors/warnings into a shared
 * registry without taking a direct dependency on `nostics`.
 *
 * Typical usage from a plugin's `setup(ctx)`:
 *
 * ```ts
 * const myDiagnostics = ctx.diagnostics.defineDiagnostics({
 *   docsBase: 'https://example.com/errors',
 *   codes: {
 *     MYP0001: { why: 'Something went wrong' },
 *   },
 * })
 * ctx.diagnostics.register(myDiagnostics)
 *
 * // Through the shared lookup (loose typing):
 * throw ctx.diagnostics.logger.MYP0001()
 *
 * // Or directly on the typed handle returned from `defineDiagnostics`:
 * throw myDiagnostics.MYP0001()
 * ```
 */
interface DevframeDiagnosticsHost {
  /**
   * Proxy-backed lookup of every registered diagnostic handle by code name.
   * Resolves to a `nostics` `DiagnosticHandle` — a callable that builds a
   * diagnostic and routes it through registered reporters; prefix with
   * `throw` to raise. Loosely typed — for autocompletion, keep a reference
   * to the typed result of `defineDiagnostics()` instead.
   */
  readonly logger: DevframeDiagnosticsLogger;
  /**
   * Register additional diagnostic definitions with this host. After
   * registration, codes from the new definition are reachable via
   * `host.logger.CODE`. Plugins that want shared output formatting should
   * build their diagnostics via `host.defineDiagnostics()` first — that
   * factory pre-wires the host's ANSI console reporter.
   */
  register: (definitions: Record<string, unknown>) => void;
  /**
   * Build a typed diagnostics object with the host's ANSI console reporter
   * pre-wired. Mirrors `nostics`'s `defineDiagnostics` so integrations don't
   * need to take a direct dependency on `nostics`.
   */
  defineDiagnostics: <const Codes extends Record<string, DiagnosticDefinition>>(options: DevframeDefineDiagnosticsOptions<Codes>) => ReturnType<typeof defineDiagnostics<Codes, any>>;
}
//#endregion
//#region src/types/host.d.ts
interface DevframeHost {
  /**
   * Serve a static directory at the given URL base. Called by
   * `DevframeViewHost.hostStatic`. Implementations map this to whatever
   * the underlying runtime expects (Vite middleware, h3 handler, no-op
   * for build snapshots).
   */
  mountStatic: (base: string, distDir: string) => void | Promise<void>;
  /**
   * Serve the host's connection meta (`__connection.json`) at the given URL
   * base, so a devframe SPA mounted there can discover the RPC/WS endpoint
   * via `connectDevframe()`'s relative `./__connection.json` fetch.
   *
   * Called by `mountDevframe` for each mounted devframe (alongside
   * `mountStatic`). Without it, an embedded SPA can only discover the
   * endpoint by inheriting it from a same-origin parent window — which fails
   * for cross-origin or sandboxed iframes. Implementations serve the same
   * meta they expose at the hub's own base. Optional: hosts that can't serve
   * a dynamic route (e.g. static-snapshot builds) may omit it.
   */
  mountConnectionMeta?: (base: string) => void | Promise<void>;
  /**
   * Return the public origin the host is reachable at, e.g.
   * `http://localhost:5173`. Used by the dock host to enrich remote
   * iframe URLs with a full `origin`. Called only when a dock needs an
   * absolute URL; hosts that never serve remote docks can return any
   * reasonable value.
   */
  resolveOrigin: () => string;
  /**
   * Resolve a directory the host owns for persisted devframe state.
   * Each host picks its own app-name namespace so storage doesn't
   * collide between, say, the Vite host (`.vite/devframe`) and a
   * standalone CLI host (`.<appName>/devframe`).
   *
   *   - `workspace` — per-project state (settings, caches). Typically
   *     under `${workspaceRoot}/node_modules/.<appName>/devframe/`.
   *   - `global`    — per-user state (auth tokens, machine-wide
   *     preferences). Typically under
   *     `${homedir()}/.<appName>/devframe/`.
   *
   * Implementations should ensure the directory exists or be safe to
   * pass to a downstream `createStorage(...)` call that creates it
   * lazily.
   */
  getStorageDir: (scope: 'workspace' | 'global') => string;
}
//#endregion
//#region src/types/rpc-augments.d.ts
/**
 * To be extended
 */
interface DevframeRpcClientFunctions {
  /**
   * Server→client notification that this connection's auth token has been
   * revoked. The client drops to untrusted on receipt. Broadcast by
   * `revokeActiveConnectionsForToken`.
   *
   * @internal
   */
  'devframe:auth:revoked': () => Promise<void>;
  /**
   * Streaming chunk pushed from server to subscribed clients. Wired by
   * `RpcStreamingHost`; do not register manually.
   *
   * @internal
   */
  'devframe:streaming:chunk': (channel: string, id: string, seq: number, chunk: any) => Promise<void>;
  /**
   * Streaming terminator pushed from server to subscribed clients. Wired by
   * `RpcStreamingHost`; do not register manually.
   *
   * @internal
   */
  'devframe:streaming:end': (channel: string, id: string, error?: {
    name: string;
    message: string;
  }) => Promise<void>;
  /**
   * Server→client cancel for an in-flight upload. Wired by
   * `RpcStreamingHost`; do not register manually.
   *
   * @internal
   */
  'devframe:streaming:upload-cancel': (channel: string, id: string) => Promise<void>;
  /**
   * Full shared-state snapshot pushed from server to subscribed clients.
   * Wired by `RpcSharedStateHost`; do not register manually.
   *
   * @internal
   */
  'devframe:rpc:client-state:updated': (key: string, fullState: any, syncId: string) => Promise<void>;
  /**
   * Incremental shared-state patch pushed from server to subscribed clients.
   * Wired by `RpcSharedStateHost`; do not register manually.
   *
   * @internal
   */
  'devframe:rpc:client-state:patch': (key: string, patches: any[], syncId: string) => Promise<void>;
}
/**
 * To be extended
 */
interface DevframeRpcServerFunctions {
  /**
   * Authenticate a connection with a previously-issued bearer token; resolves
   * whether the connection is now trusted. The interactive handler is provided
   * by the host adapter (e.g. Vite DevTools); the standalone server registers
   * an auto-trust noop when `auth: false`.
   *
   * Named with the `anonymous:` prefix (see `isAnonymousRpcMethod`) so it is
   * reachable before the connection is trusted — this is the *only* rule the
   * pre-trust gate applies, no per-method allowlist.
   *
   * @internal
   */
  'anonymous:devframe:auth': (params: {
    authToken: string;
    ua: string;
    origin: string;
  }) => Promise<{
    isTrusted: boolean;
  }>;
  /**
   * Exchange a one-time authentication code (shown by the dev server) for a fresh,
   * node-issued bearer token, returning the token on success or `null`. The
   * handler is provided by the host adapter on top of `exchangeTempAuthCode`.
   *
   * Named with the `anonymous:` prefix (see `isAnonymousRpcMethod`) so it is
   * reachable before the connection is trusted.
   *
   * @internal
   */
  'anonymous:devframe:auth:exchange': (params: {
    code: string;
    ua: string;
    origin: string;
  }) => Promise<{
    authToken: string | null;
  }>;
  /**
   * Self-revoke: the caller asks the server to revoke its own bearer token
   * (if any) and drop to untrusted. Requires an already-trusted caller, so
   * unlike the two handshake methods above it does **not** carry the
   * `anonymous:` prefix. Registered by `recipes/interactive-auth`.
   *
   * @internal
   */
  'devframe:auth:revoke': () => Promise<void>;
  /**
   * Subscribe a client to a shared-state key. Wired by
   * `RpcSharedStateHost`; do not register manually.
   *
   * @internal
   */
  'devframe:rpc:server-state:subscribe': (key: string) => Promise<void>;
  /**
   * Read the current value for a shared-state key. Wired by
   * `RpcSharedStateHost`; do not register manually.
   *
   * @internal
   */
  'devframe:rpc:server-state:get': (key: string) => Promise<any>;
  /**
   * Replace a shared-state value (from the client). Wired by
   * `RpcSharedStateHost`; do not register manually.
   *
   * @internal
   */
  'devframe:rpc:server-state:set': (key: string, value: any, syncId: string) => Promise<void>;
  /**
   * Apply a patch to a shared-state value (from the client). Wired by
   * `RpcSharedStateHost`; do not register manually.
   *
   * @internal
   */
  'devframe:rpc:server-state:patch': (key: string, patches: any[], syncId: string) => Promise<void>;
  /**
   * Client→server streaming subscription with optional replay cursor.
   * Wired by `RpcStreamingHost`; do not register manually.
   *
   * @internal
   */
  'devframe:streaming:subscribe': (channel: string, id: string, opts?: {
    afterSeq?: number;
  }) => Promise<void>;
  /**
   * Client→server streaming unsubscribe. Wired by `RpcStreamingHost`;
   * do not register manually.
   *
   * @internal
   */
  'devframe:streaming:unsubscribe': (channel: string, id: string) => Promise<void>;
  /**
   * Client→server streaming cancellation request. Wired by
   * `RpcStreamingHost`; do not register manually.
   *
   * @internal
   */
  'devframe:streaming:cancel': (channel: string, id: string) => Promise<void>;
  /**
   * Client→server upload chunk. Wired by `RpcStreamingHost`; do not
   * register manually.
   *
   * @internal
   */
  'devframe:streaming:upload-chunk': (channel: string, id: string, seq: number, chunk: any) => Promise<void>;
  /**
   * Client→server upload terminator. Wired by `RpcStreamingHost`; do not
   * register manually.
   *
   * @internal
   */
  'devframe:streaming:upload-end': (channel: string, id: string, error?: {
    name: string;
    message: string;
  }) => Promise<void>;
}
/**
 * To be extended
 */
interface DevframeRpcSharedStates {}
//#endregion
//#region src/types/views.d.ts
interface DevframeViewHost {
  /**
   * @internal
   */
  buildStaticDirs: {
    baseUrl: string;
    distDir: string;
  }[];
  /**
   * Helper to host static files
   * - In `dev` mode, it will register middleware to `viteServer.middlewares` to host the static files
   * - In `build` mode, it will copy the static files to the dist directory
   */
  hostStatic: (baseUrl: string, distDir: string) => void;
}
//#endregion
//#region src/types/scope.d.ts
type AnyRpcFn = (...args: any[]) => any;
/**
 * Augmentable registry mapping a scope namespace to the shape of its
 * persisted settings. Tools augment it so `ctx.scope('my-plugin')`
 * gets a fully-typed `settings.global` / `settings.project`:
 *
 * ```ts
 * declare module 'devframe' {
 *   interface DevframeSettingsRegistry {
 *     'my-plugin': { theme: 'light' | 'dark', recentFiles: string[] }
 *   }
 * }
 * ```
 */
interface DevframeSettingsRegistry {}
/**
 * Resolve the settings shape for a namespace from
 * {@link DevframeSettingsRegistry}, falling back to an open record when
 * the namespace hasn't been augmented.
 */
type SettingsForNamespace<NS extends string> = NS extends keyof DevframeSettingsRegistry ? DevframeSettingsRegistry[NS] extends Record<string, any> ? DevframeSettingsRegistry[NS] : Record<string, any> : Record<string, any>;
/**
 * A persisted key-value settings store for one scope (`global` or
 * `project`). Backed by a file on the node side and by the shared-state
 * sync protocol on the client, so a `set` on either side propagates to
 * every connected peer and survives restarts.
 *
 * Every method is async because the underlying shared state is resolved
 * lazily on first access.
 */
interface DevframeSettingsStore<T extends Record<string, any> = Record<string, any>> {
  /** Read a single setting. Resolves to `undefined` when unset. */
  get: <K extends keyof T>(key: K) => Promise<T[K] | undefined>;
  /** Write a single setting. */
  set: <K extends keyof T>(key: K, value: T[K]) => Promise<void>;
  /** Remove a single setting. */
  delete: <K extends keyof T>(key: K) => Promise<void>;
  /** Read the whole settings object (immutable snapshot). */
  all: () => Promise<Readonly<T>>;
  /**
   * Subscribe to settings changes. Resolves to an unsubscribe function.
   * Fires on every local or remote mutation with the full snapshot.
   */
  onChange: (fn: (value: Readonly<T>) => void) => Promise<() => void>;
}
/**
 * The two settings scopes available on a scoped context.
 *
 *   - `project` — per-workspace state, persisted under the host's
 *     `workspace` storage dir. Project-local settings.
 *   - `global`  — per-user state, persisted under the host's `global`
 *     storage dir. Machine-wide preferences.
 */
interface DevframeSettings<T extends Record<string, any> = Record<string, any>> {
  global: DevframeSettingsStore<T>;
  project: DevframeSettingsStore<T>;
}
/**
 * Map the server-side RPC registry down to the bare names owned by a
 * namespace, so a scoped `call('get-cwd')` is typed without the
 * `my-plugin:` prefix.
 */
type ScopedServerFunctions<NS extends string> = { [K in keyof DevframeRpcServerFunctions as K extends `${NS}:${infer R}` ? R : never]: DevframeRpcServerFunctions[K] };
/**
 * Map the client-side RPC registry down to the bare names owned by a
 * namespace, used by scoped `broadcast`.
 */
type ScopedClientFunctions<NS extends string> = { [K in keyof DevframeRpcClientFunctions as K extends `${NS}:${infer R}` ? R : never]: DevframeRpcClientFunctions[K] };
/**
 * Map the shared-state registry down to the bare keys owned by a
 * namespace, so scoped `sharedState('messages')` is typed without the
 * `my-plugin:` prefix.
 */
type ScopedSharedStates<NS extends string> = { [K in keyof DevframeRpcSharedStates as K extends `${NS}:${infer R}` ? R : never]: DevframeRpcSharedStates[K] };
/**
 * Broadcast options for a scoped client method (bare name).
 */
interface ScopedBroadcastOptions<METHOD, Args extends any[]> {
  method: METHOD;
  args: Args;
  optional?: boolean;
  event?: boolean;
}
/**
 * Node-side streaming host scoped to a namespace. Channel names are
 * auto-prefixed with `<namespace>:`.
 */
interface DevframeScopedStreamingHost {
  /**
   * Register a streaming channel. The bare `name` is auto-prefixed with
   * the scope namespace (`<namespace>:<name>`); pass an already-qualified
   * name (containing `:`) to opt out.
   */
  create: <T = unknown>(name: string, opts?: RpcStreamingChannelOptions) => RpcStreamingChannel<T>;
}
/**
 * The scoped node RPC surface exposed on `ctx.scope('my-plugin').rpc`.
 * IDs and keys you pass are auto-namespaced with `my-plugin:`.
 */
interface DevframeScopedNodeRpc<NS extends string = string> {
  /** The namespace this surface is scoped to. */
  readonly namespace: NS;
  /**
   * Register a server RPC function. The definition's `name` must be bare
   * (no `:`); it is stored as `<namespace>:<name>`. Throws `DF0034` if an
   * already-namespaced name is passed.
   */
  register: (fn: RpcFunctionDefinition<string, any, any, any, any, any, DevframeNodeContext>, force?: boolean) => void;
  /**
   * Update a previously registered server RPC function. Same naming rules
   * as {@link DevframeScopedNodeRpc.register}.
   */
  update: (fn: RpcFunctionDefinition<string, any, any, any, any, any, DevframeNodeContext>, force?: boolean) => void;
  /**
   * Invoke a locally registered server RPC function. Bare names are
   * resolved within this namespace; pass a fully-qualified name
   * (containing `:`) to call another scope's function.
   */
  call: {
    <T extends keyof ScopedServerFunctions<NS> & string>(method: T, ...args: Parameters<Extract<ScopedServerFunctions<NS>[T], AnyRpcFn>>): Promise<Awaited<ReturnType<Extract<ScopedServerFunctions<NS>[T], AnyRpcFn>>>>;
    <T extends keyof DevframeRpcServerFunctions & string>(method: T, ...args: Parameters<Extract<DevframeRpcServerFunctions[T], AnyRpcFn>>): Promise<Awaited<ReturnType<Extract<DevframeRpcServerFunctions[T], AnyRpcFn>>>>;
    (method: string, ...args: any[]): Promise<any>;
  };
  /**
   * Broadcast a client RPC event to every connected client. Bare method
   * names are resolved within this namespace.
   */
  broadcast: {
    <T extends keyof ScopedClientFunctions<NS> & string>(options: ScopedBroadcastOptions<T, Parameters<Extract<ScopedClientFunctions<NS>[T], AnyRpcFn>>>): Promise<void>;
    (options: ScopedBroadcastOptions<string, any[]>): Promise<void>;
  };
  /**
   * Resolve a namespaced shared state. Bare keys are resolved within this
   * namespace; pass a fully-qualified key (containing `:`) to opt out.
   */
  sharedState: {
    <T extends keyof ScopedSharedStates<NS> & string>(key: T, options?: RpcSharedStateGetOptions<ScopedSharedStates<NS>[T]>): Promise<SharedState<ScopedSharedStates<NS>[T]>>;
    <T extends Record<string, any> = Record<string, any>>(key: string, options?: RpcSharedStateGetOptions<T>): Promise<SharedState<T>>;
  };
  /** Streaming host scoped to this namespace. */
  streaming: DevframeScopedStreamingHost;
  /** Pass-through to the current RPC session, when called inside a handler. */
  getCurrentRpcSession: () => DevframeNodeRpcSession | undefined;
}
/**
 * A namespace-scoped view of {@link DevframeNodeContext}. Returned by
 * `ctx.scope('my-plugin')`. Re-exposes the unscoped surfaces (`views`,
 * `diagnostics`, `agent`, …), replaces `rpc` with the auto-namespaced
 * {@link DevframeScopedNodeRpc}, and adds a top-level `settings` store.
 */
interface DevframeScopedNodeContext<NS extends string = string, Settings extends Record<string, any> = Record<string, any>> {
  /** The namespace this context is scoped to. */
  readonly namespace: NS;
  /** The underlying unscoped context. */
  readonly base: DevframeNodeContext;
  readonly workspaceRoot: string;
  readonly cwd: string;
  readonly mode: 'dev' | 'build';
  host: DevframeHost;
  rpc: DevframeScopedNodeRpc<NS>;
  /** Persisted settings for this namespace (`global` + `project`). */
  settings: DevframeSettings<Settings>;
  views: DevframeViewHost;
  diagnostics: DevframeDiagnosticsHost;
  agent: DevframeAgentHost;
  /**
   * Return a new scoped context, replacing the current scope. Pass `null`
   * or `''` to un-scope and get the base context.
   */
  scope: DevframeNodeContext['scope'];
}
//#endregion
//#region src/types/utils.d.ts
type Thenable<T> = T | Promise<T>;
type EntriesToObject<T extends readonly [string, any][]> = { [K in T[number] as K[0]]: K[1] };
type PartialWithoutId<T extends {
  id: string;
}> = Partial<Omit<T, 'id'>> & {
  id: string;
};
//#endregion
//#region src/utils/shared-state.d.ts
type ImmutablePrimitive = undefined | null | boolean | string | number | Function;
type Immutable<T> = T extends ImmutablePrimitive ? T : T extends Array<infer U> ? ImmutableArray<U> : T extends Map<infer K, infer V> ? ImmutableMap<K, V> : T extends Set<infer M> ? ImmutableSet<M> : ImmutableObject<T>;
type ImmutableArray<T> = ReadonlyArray<Immutable<T>>;
type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };
/**
 * Serializable patch describing a single mutation to a `SharedState`.
 * Structurally compatible with JSON-Patch and is safe to send over RPC.
 */
interface SharedStatePatch {
  op: 'add' | 'remove' | 'replace';
  path: readonly (string | number)[];
  value?: unknown;
}
/**
 * State host that is immutable by default with explicit mutate.
 */
interface SharedState<T> {
  /**
   * Get the current state. Immutable.
   */
  value: () => Immutable<T>;
  /**
   * Subscribe to state changes.
   */
  on: EventEmitter<SharedStateEvents<T>>['on'];
  /**
   * Mutate the state.
   */
  mutate: (fn: (state: T) => void, syncId?: string) => void;
  /**
   * Apply patches to the state.
   */
  patch: (patches: SharedStatePatch[], syncId?: string) => void;
  /**
   * Sync IDs that have been applied to the state.
   */
  syncIds: Set<string>;
}
interface SharedStateEvents<T> {
  updated: (fullState: T, patches: SharedStatePatch[] | undefined, syncId: string) => void;
}
interface SharedStateOptions<T> {
  /**
   * Initial state.
   */
  initialValue: T;
  /**
   * Enable patches.
   *
   * @default false
   */
  enablePatches?: boolean;
}
declare function createSharedState<T extends object>(options: SharedStateOptions<T>): SharedState<T>;
//#endregion
//#region src/utils/streaming-channel.d.ts
/**
 * Serialized error shape sent over the wire when a stream ends with a failure.
 * Stays JSON-safe so the strict-JSON encoder can carry it without coercion.
 */
interface StreamErrorPayload {
  name: string;
  message: string;
}
/**
 * Single buffered chunk in the server-side ring buffer.
 *
 * Sequence numbers start at 1 and increment per write. Subscribers track
 * `lastSeenSeq` and ask for `afterSeq` on resubscribe so the server can
 * replay any chunks the client missed during a brief disconnect.
 */
interface BufferedChunk<T> {
  seq: number;
  chunk: T;
}
interface StreamSinkEvents<T> {
  /** Fired for each `write()`. The RPC layer subscribes and broadcasts. */
  chunk: (seq: number, chunk: T) => void;
  /** Terminal — fired exactly once per sink lifetime. */
  end: (error?: StreamErrorPayload) => void;
}
interface CreateStreamSinkOptions {
  id?: string;
  /**
   * Size of the per-stream ring buffer kept for replay-on-resubscribe.
   * `0` (default) disables replay.
   */
  replayWindow?: number;
}
/**
 * Server-side producer handle. Two equivalent surfaces share one piece of
 * state: the imperative `write/error/close` triple, and a `WritableStream<T>`
 * for `pipeTo`-style consumption.
 */
interface StreamSink<T> {
  /** Stable id used by clients to subscribe. */
  readonly id: string;
  /**
   * Aborts when the consumer cancels (server-side) or when the transport
   * loses every subscriber. Producers should poll `signal.aborted` and exit
   * cleanly.
   */
  readonly signal: AbortSignal;
  /** `true` after `close()` / `error()`. Further writes throw. */
  readonly closed: boolean;
  /** Last allocated sequence number. `0` until the first write. */
  readonly lastSeq: number;
  write: (chunk: T) => void;
  error: (reason: unknown) => void;
  close: () => void;
  /** External-cancel path. Aborts the signal so handlers can short-circuit. */
  abort: (reason?: unknown) => void;
  /** `WritableStream<T>` adapter — same in-memory state as the imperative API. */
  readonly writable: WritableStream<T>;
  /**
   * Internal — RPC layer subscribes to receive chunk/end notifications.
   * Not part of the public contract; do not call directly.
   *
   * @internal
   */
  readonly events: EventEmitter<StreamSinkEvents<T>>;
  /**
   * Internal — replay buffer. RPC layer reads on (re)subscribe to feed
   * missed chunks before going live.
   *
   * @internal
   */
  readonly buffer: ReadonlyArray<BufferedChunk<T>>;
}
interface CreateStreamReaderOptions {
  id?: string;
  /**
   * Maximum number of buffered chunks held client-side while the consumer
   * isn't draining. On overflow, the oldest chunk is dropped.
   */
  highWaterMark?: number;
  /**
   * Called when the chunk queue overflows the high-water mark. The RPC
   * layer wires this to a coded warning; the primitive itself is
   * RPC-agnostic.
   */
  onOverflow?: (dropped: number) => void;
  /** Called when the consumer cancels — the RPC layer sends `:cancel` upstream. */
  onCancel?: () => void;
}
/**
 * Client-side consumer handle. Both an `AsyncIterable<T>` (for `for await`)
 * and exposes `readable: ReadableStream<T>` (for `pipeTo`). Pick one — they
 * share a single internal queue, so concurrent draining will race.
 */
interface StreamReader<T> extends AsyncIterable<T> {
  readonly id: string;
  readonly cancelled: boolean;
  readonly done: boolean;
  /** Highest `seq` observed. Used for replay on reconnect. */
  readonly lastSeenSeq: number;
  /** `ReadableStream<T>` adapter for `pipeTo`-style consumption. */
  readonly readable: ReadableStream<T>;
  cancel: () => void;
  /** @internal */
  _push: (seq: number, chunk: T) => void;
  /** @internal */
  _end: (error?: StreamErrorPayload) => void;
}
/**
 * Build a server-side stream sink. RPC-agnostic — the RPC host wires
 * `events.on('chunk' | 'end')` to broadcast, and reads `buffer` to replay
 * for late or reconnecting subscribers.
 */
declare function createStreamSink<T>(options?: CreateStreamSinkOptions): StreamSink<T>;
/**
 * Build a client-side stream reader. RPC-agnostic — the RPC host calls
 * `_push(seq, chunk)` on each incoming chunk and `_end(error?)` on the
 * terminal frame. Consumers iterate with `for await` or pipe `readable`.
 */
declare function createStreamReader<T>(options?: CreateStreamReaderOptions): StreamReader<T>;
//#endregion
//#region src/types/rpc.d.ts
interface DevframeNodeRpcSession {
  meta: DevframeNodeRpcSessionMeta;
  rpc: BirpcReturn<DevframeRpcClientFunctions, DevframeRpcServerFunctions, false>;
}
interface RpcBroadcastOptions<METHOD, Args extends any[]> {
  method: METHOD;
  args: Args;
  optional?: boolean;
  event?: boolean;
  filter?: (client: BirpcReturn<DevframeRpcClientFunctions, DevframeRpcServerFunctions, false>) => boolean | void;
}
type RpcFunctionsHost = RpcFunctionsCollectorBase<DevframeRpcServerFunctions, DevframeNodeContext> & {
  /**
   * Invoke a locally registered server RPC function directly.
   *
   * This bypasses transport and is useful for server-side cross-function calls.
   */
  invokeLocal: <T extends keyof DevframeRpcServerFunctions, Args extends Parameters<DevframeRpcServerFunctions[T]>>(method: T, ...args: Args) => Promise<Awaited<ReturnType<DevframeRpcServerFunctions[T]>>>;
  /**
   * Broadcast a message to all connected clients
   */
  broadcast: <T extends keyof DevframeRpcClientFunctions, Args extends Parameters<DevframeRpcClientFunctions[T]>>(options: RpcBroadcastOptions<T, Args>) => Promise<void>;
  /**
   * Get the current RPC client
   *
   * Available in RPC functions to get the current RPC client
   */
  getCurrentRpcSession: () => DevframeNodeRpcSession | undefined;
  /**
   * The shared state host
   */
  sharedState: RpcSharedStateHost;
  /**
   * The streaming channel host. Provides per-channel `start()` /
   * `pipeFrom()` producers; clients consume via `rpc.streaming.subscribe()`.
   *
   * @see RpcStreamingHost
   */
  streaming: RpcStreamingHost;
};
interface RpcSharedStateGetOptions<T> {
  sharedState?: SharedState<T>;
  initialValue?: T;
}
interface RpcSharedStateHost {
  get: <T extends object = any>(key: string, options?: RpcSharedStateGetOptions<T>) => Promise<SharedState<T>>;
  keys: () => string[];
  /**
   * Subscribe to new shared-state keys becoming available. Fires when
   * `get(key, ...)` creates a fresh entry (not on subsequent gets).
   * Useful for protocol adapters (e.g. MCP) that surface shared state
   * as dynamic resources.
   */
  onKeyAdded: (fn: (key: string) => void) => () => void;
}
/**
 * Options for `RpcStreamingHost.create()`.
 */
interface RpcStreamingChannelOptions {
  /**
   * Size of the per-stream ring buffer kept on the server for
   * replay-on-resubscribe. `0` (default) disables replay; on reconnect
   * the consumer only sees chunks that arrive after subscribing.
   *
   * The buffer is per stream id, not per channel — each `channel.start()`
   * gets its own.
   */
  replayWindow?: number;
  /**
   * Milliseconds a closed stream is retained on the server after its
   * last subscriber leaves (or if no subscriber ever arrived). During
   * this window, late subscribers can still join and replay the buffer
   * + receive the `end` frame.
   *
   * Defaults to `30_000` (30 s) when `replayWindow > 0`, else `0`
   * (immediate free). Set to `0` to opt out, or higher for longer
   * post-mortem replay.
   */
  closedStreamRetention?: number;
}
/**
 * Channel handle returned by `ctx.rpc.streaming.create(name, opts)`. A
 * channel owns a wire namespace; calling `start()` produces individual
 * streams keyed by id.
 *
 * @see {@link https://devfra.me/guide/streaming Streaming guide}
 */
interface RpcStreamingChannel<T = unknown> {
  /** Channel name as registered with `ctx.rpc.streaming.create()`. */
  readonly name: string;
  /**
   * Start a new stream. Returns a server-side sink with both an imperative
   * (`write` / `close` / `error`) surface and a `WritableStream<T>` for
   * `pipeTo` consumption. The sink's `signal` aborts when every subscriber
   * disconnects or cancels.
   */
  start: (opts?: {
    id?: string;
  }) => StreamSink<T>;
  /**
   * Convenience: start a stream and pipe a `ReadableStream<T>` into it.
   * The pipe uses `sink.signal` so cancellation propagates upstream.
   *
   * Node-stream interop: convert a `Readable` with `Readable.toWeb(node)`
   * before passing it here.
   */
  pipeFrom: (readable: ReadableStream<T>, opts?: {
    id?: string;
  }) => Promise<StreamSink<T>>;
  /** Look up an active stream by id. Returns `undefined` if none. */
  get: (id: string) => StreamSink<T> | undefined;
  /** All active outbound stream ids on this channel. */
  ids: () => string[];
  /**
   * Open an inbound stream — the server side of a client-to-server
   * upload. Allocates an id, returns a `StreamReader<T>` that fills as
   * the client writes chunks. Typical pattern is to call this from an
   * action handler, kick off background processing, and return the id
   * so the caller can start uploading:
   *
   * ```ts
   * handler: async () => {
   *   const reader = channel.openInbound()
   *   ;(async () => {
   *     for await (const chunk of reader) processChunk(chunk)
   *   })()
   *   return { uploadId: reader.id }
   * }
   * ```
   *
   * Calling `reader.cancel()` on the server sends an `upload-cancel` to
   * the uploading client, which aborts its sink.
   */
  openInbound: (opts?: {
    id?: string;
  }) => StreamReader<T>;
}
/**
 * Server-side streaming host. Lives on `ctx.rpc.streaming` alongside
 * `ctx.rpc.sharedState`. Each named channel owns its own stream registry
 * and wire namespace.
 */
interface RpcStreamingHost {
  /**
   * Register a streaming channel. Names follow the `<plugin-id>:<channel>`
   * convention (e.g. `'my-devtool:chat-stream'`). Throws `DF0032` if the
   * name is already taken.
   */
  create: <T = unknown>(name: string, opts?: RpcStreamingChannelOptions) => RpcStreamingChannel<T>;
  /**
   * Adapters call this when a session disconnects so the host can drop
   * subscribers and abort orphaned streams. Most users do not need this;
   * it's wired by `startHttpAndWs` automatically.
   *
   * @internal
   */
  _onSessionDisconnected: (meta: DevframeNodeRpcSessionMeta) => void;
}
//#endregion
//#region src/types/context.d.ts
interface DevframeCapabilities {
  rpc?: boolean;
  views?: boolean;
}
/**
 * Framework- and build-tool-agnostic node context — RPC + diagnostics +
 * agent + the view-host (HTTP file-serving). Host adapters can wrap this
 * to add their own surfaces; for example, `@vitejs/devtools-kit`'s
 * `createKitContext` adds `docks`, `terminals`, `messages`, and
 * `commands` when mounted into Vite DevTools.
 */
interface DevframeNodeContext {
  readonly workspaceRoot: string;
  readonly cwd: string;
  /**
   * Lifecycle distinction surfaced to plugin authors:
   *
   *   - `'dev'`   — long-running, interactive session. Connections come and
   *                 go; broadcasts and shared-state mutations are debounced
   *                 to keep the UI responsive.
   *   - `'build'` — one-shot batch run. The context is set up, the devtool
   *                 collects what it needs, and a snapshot is written. No
   *                 live UI, no WS server.
   *
   * Names are inherited from Vite's serve/build dichotomy but the meaning
   * is general: the same distinction applies to any tool that runs in
   * either an interactive or a static-output mode.
   */
  readonly mode: 'dev' | 'build';
  /**
   * Host runtime abstraction — exposes `mountStatic` / `resolveOrigin` /
   * `getStorageDir`.
   */
  host: DevframeHost;
  rpc: RpcFunctionsHost;
  views: DevframeViewHost;
  /**
   * Structured diagnostics host — wraps `nostics` and lets integrations
   * register their own coded errors/warnings into the shared lookup.
   */
  diagnostics: DevframeDiagnosticsHost;
  /**
   * Agent host — aggregates the agent-exposed surface of this devtool.
   *
   * @experimental
   */
  agent: DevframeAgentHost;
  /**
   * Create a namespace-scoped view of this context. The returned
   * `ctx.scope('my-plugin')` auto-namespaces every RPC id, shared-state
   * key, and streaming channel with `my-plugin:`, and exposes a typed
   * top-level `settings` store. This is the preferred way to consume the
   * context from a single tool's setup code.
   *
   * Pass `null` or `''` to un-scope and get the base context.
   */
  scope: {
    <NS extends string>(namespace: NS): DevframeScopedNodeContext<NS, SettingsForNamespace<NS>>;
    (namespace?: null | ''): DevframeNodeContext;
  };
}
/**
 * Describes where the browser client should open its RPC WebSocket. The
 * object form is the proxy-flexible default: `path` is resolved relative to
 * where `__connection.json` was loaded, and the connection is made to the
 * page's own origin (only the `http`→`ws` / `https`→`wss` protocol swap is
 * applied). This survives reverse proxies that change the host/port, because
 * the client never trusts a server-baked hostname — it reuses its own.
 *
 * Set `port` (and/or `host`) only when the WS endpoint genuinely lives on a
 * different origin than the page, e.g. a side-car server on its own port.
 */
interface ConnectionMetaWebsocket {
  /**
   * Path to the WS endpoint. Relative paths (the default, e.g. `__devframe_ws`) are
   * resolved against `__connection.json`'s location; absolute paths (`/__devframe_ws`)
   * resolve against the page origin.
   */
  path?: string;
  /** Override the port. Combined with the page hostname unless `host` is set. */
  port?: number;
  /** Override the host (`hostname[:port]`). Use for a fully cross-origin endpoint. */
  host?: string;
}
interface ConnectionMeta {
  backend: 'websocket' | 'static';
  /**
   * WebSocket endpoint, resolved by the client into a `ws(s)://` URL:
   *
   *   - {@link ConnectionMetaWebsocket} — the proxy-flexible default; a
   *     same-origin path relative to `__connection.json`.
   *   - `number` — a port on the page's hostname (`ws(s)://<host>:<port>`).
   *   - `string` — a full `ws://`/`wss://` URL used verbatim, an `http(s)://`
   *     URL with its protocol swapped, or a path resolved same-origin.
   */
  websocket?: number | string | ConnectionMetaWebsocket;
  /**
   * Present when the dev server exposes a route-based MCP endpoint
   * (`cli.mcp`). Advertises the MCP Streamable-HTTP route so in-browser
   * tooling (e.g. an MCP inspector) can discover it without guessing the
   * path. `path` is relative to `__connection.json`'s location, like the
   * WebSocket `path`.
   */
  mcp?: {
    path: string;
  };
  /**
   * Names of RPC functions that have declared `jsonSerializable: true`.
   * Used by the WS / static client to dispatch the per-call wire
   * serializer (strict JSON for these methods, structured-clone for
   * the rest). Populated by the server / build adapter; absent on
   * legacy clients, in which case all outgoing messages fall back to
   * structured-clone.
   */
  jsonSerializableMethods?: string[];
}
//#endregion
//#region src/types/devframe.d.ts
type DevframeRuntime = 'cli' | 'build' | 'spa' | 'vite' | 'embedded';
/**
 * Classification of how a devframe is being deployed. Hosted adapters
 * (`vite`, `embedded`) share their origin with a host app and must
 * namespace their mount path under `/__<id>/`. Standalone adapters
 * (`cli`, `spa`, `build`) own the origin and default to `/`.
 */
type DevframeDeploymentKind = 'standalone' | 'hosted';
/**
 * How a hub deduplicates devframes that share an `id` when more than one
 * is mounted onto the same hub. See {@link DevframeDefinition.duplicationStrategy}.
 *
 * - `'warn'` (default) — keep the first registration, drop later
 *   duplicates, and emit a warning diagnostic (`DF8105`).
 * - `'silent'` — drop later duplicates without warning.
 * - `'throw'` — throw when a duplicate is mounted.
 * - `'duplicate'` — let every instance coexist under a disambiguated
 *   dock id.
 */
type DevframeDuplicationStrategy = 'warn' | 'silent' | 'throw' | 'duplicate';
/**
 * Controls where the browser opens the RPC WebSocket — advertised in
 * `__connection.json` and used to bind the dev server. The three shapes map
 * to the three connection scenarios; precedence is `url` > `port` > `route`:
 *
 *   1. **Same server, different route** (default) — leave `port`/`url` unset.
 *      The socket shares the HTTP server's port and binds to `route`
 *      (`__devframe_ws`). The client connects to its own origin, so the link
 *      survives a reverse proxy that rewrites the host/port/subpath.
 *
 *   2. **Different port** — set `port`. The socket binds on its own port on the
 *      same host; the client targets `ws(s)://<page-host>:<port>/<route>`.
 *
 *   3. **Remote, different origin** — set `url` to a full `ws://`/`wss://`
 *      endpoint (e.g. a public tunnel or relay). The client uses it verbatim.
 */
interface DevframeWsOptions {
  /**
   * Upgrade route segment the socket binds to and is advertised at, relative
   * to the SPA base. Default: `__devframe_ws`.
   */
  route?: string;
  /**
   * Bind the socket on its own port instead of sharing the HTTP port. The
   * browser connects to this port on the page's hostname.
   */
  port?: number;
  /**
   * Advertise a fixed, fully-qualified endpoint on another origin (a full
   * `ws://`/`wss://` URL). Takes precedence over `port`/`route` in the meta.
   */
  url?: string;
}
/**
 * Configuration for the route-based MCP server mounted alongside the dev
 * server (opt-in via {@link DevframeCliOptions.mcp}). The endpoint speaks
 * the MCP Streamable-HTTP transport over the same origin as the SPA,
 * exposing the definition's `ctx.agent` tools + shared-state resources to
 * external MCP clients connected to the *running* server.
 *
 * @experimental The agent-native surface is experimental and may change
 * without a major version bump until it stabilizes.
 */
interface McpRouteOptions {
  /**
   * Route segment the MCP endpoint binds to, relative to the SPA base.
   * Default: `__mcp` (i.e. `/__mcp` standalone, `/__<id>/__mcp` hosted).
   */
  path?: string;
  /**
   * Extra `Origin` header values to accept beyond the loopback default
   * (`localhost`/`127.0.0.1`/`::1` and any `Origin`-less native client).
   * Add your LAN/tunnel origin here when reaching the endpoint from another
   * host, mirroring the WS transport's origin gate. Pass `false` to disable
   * origin checking entirely (not recommended). Default: loopback-only.
   *
   * This is the endpoint's DNS-rebinding protection — the shared
   * `isAllowedOrigin` gate the WS upgrade already uses, applied as external
   * middleware (the approach the MCP SDK now recommends over its own
   * deprecated `allowedHosts`/`allowedOrigins` transport flags).
   */
  allowedOrigins?: readonly string[] | false;
}
interface DevframeCliOptions {
  /** Binary name; default: the devframe's `id`. */
  command?: string;
  /** Preferred port for the dev server (default 9999). */
  port?: number;
  /** Port scan range, forwarded to `get-port-please`. */
  portRange?: [number, number];
  /** Prefer a random open port. */
  random?: boolean;
  /** Default host to bind to; `--host` overrides. */
  host?: string;
  /**
   * Auto-open the browser when the dev server starts.
   * `true` opens the resolved origin; a string opens that relative path.
   * The `--open` / `--no-open` flags override this.
   */
  open?: boolean | string;
  /**
   * Skip the RPC trust handshake. Set to `false` for trusted
   * single-user localhost tools. Default `true`.
   *
   * Forwarded to `startHttpAndWs` as a no-op placeholder until devframe
   * ships its own auth layer; `@vitejs/devtools` honors the equivalent
   * `devtools.clientAuth` today.
   */
  auth?: boolean;
  /**
   * Expose a route-based MCP server alongside the dev server, speaking the
   * MCP Streamable-HTTP transport at `/__mcp` (relative to the base path).
   * It surfaces the same `ctx.agent` tools + shared-state resources as the
   * stdio `mcp` command, but against the live, running server.
   *
   * - `false` / omitted (default) — no MCP route is mounted.
   * - `true` — mount at the default `__mcp` route with the loopback-only
   *   origin gate.
   * - {@link McpRouteOptions} — customise the route path / allowed origins.
   *
   * The `--mcp` / `--no-mcp` CLI flags override this per run.
   *
   * @experimental
   */
  mcp?: boolean | McpRouteOptions;
  /** Author's SPA dist directory (served as the devframe's UI). */
  distDir?: string;
  /**
   * How the browser reaches the RPC WebSocket. Defaults to sharing the HTTP
   * port on the `__devframe_ws` route. See {@link DevframeWsOptions} for the
   * different-port and remote-origin variants.
   */
  ws?: DevframeWsOptions;
  /**
   * Capability-side CAC hook. Called with the CAC instance after the
   * adapter registers its built-in commands (`build` / `spa` / `mcp`)
   * but before `createCli`'s own `configureCli` caller. Use this to
   * contribute tool-specific flags and subcommands from the definition
   * itself.
   */
  configure?: (cli: CAC) => void;
  /**
   * Typed CLI flags for the default `dev` command, backed by valibot
   * schemas. The adapter registers matching `--kebab-key` options on
   * CAC, validates the parsed values, and forwards the typed bag to
   * `setup(ctx, { flags })`.
   *
   * Use {@link defineCliFlags} to preserve the literal schema-map
   * shape, and {@link InferCliFlags} to recover the typed output at the
   * call site:
   *
   * ```ts
   * const appFlags = defineCliFlags({
   *   depth: v.pipe(v.number(), v.integer()),
   *   config: v.optional(v.string()),
   * })
   *
   * defineDevframe({
   *   cli: { flags: appFlags },
   *   setup(ctx, info) {
   *     const flags = info.flags as InferCliFlags<typeof appFlags>
   *   },
   * })
   * ```
   */
  flags?: CliFlagsSchema;
}
interface DevframeSpaOptions {
  base?: string;
  /**
   * How the deployed SPA loads its data.
   * - `'query'` — read from URL search params.
   * - `'upload'` — accept a file drag-drop.
   * - `'none'`  — use the baked RPC dump only.
   */
  loader?: 'query' | 'upload' | 'none';
}
interface DevframeBrowserContext {
  /**
   * The connected RPC client (may be write-disabled in static/spa modes).
   */
  rpc: unknown;
}
/**
 * Runtime information threaded into `setup(ctx, info)`. Adapters
 * populate the fields that make sense for their deployment. In
 * particular, `createCli` fills `flags` with the parsed CAC bag.
 */
interface DevframeSetupInfo {
  /** Parsed CLI flags, populated by the CLI adapter. */
  flags?: Record<string, unknown>;
}
interface DevframeDefinition {
  id: string;
  name: string;
  /** Semver of the tool, surfaced in hub UIs and diagnostics. */
  version: string;
  /** npm package name the devframe ships in (e.g. `@scope/my-tool`). */
  packageName: string;
  /** Project homepage or documentation URL. */
  homepage: string;
  /** One-line summary of what the tool does. */
  description: string;
  icon?: string | {
    light: string;
    dark: string;
  };
  /**
   * Mount path override. Defaults depend on the adapter:
   * `/` for standalone (`cli` / `spa` / `build`), `/__<id>/` for hosted
   * (`vite` / `embedded`).
   */
  basePath?: string;
  /**
   * How a hub reacts when another devframe sharing this one's `id` is
   * mounted onto the same hub. Consulted only by hub adapters
   * (`mountDevframe`); standalone adapters (`cli` / `spa` / `build`)
   * ignore it.
   *
   * @default 'warn'
   */
  duplicationStrategy?: DevframeDuplicationStrategy;
  capabilities?: {
    dev?: boolean | Record<string, boolean>;
    build?: boolean | Record<string, boolean>;
    spa?: boolean | Record<string, boolean>;
  };
  /** Server-side setup — the primary entrypoint. Runs in every runtime. */
  setup: (ctx: DevframeNodeContext, info?: DevframeSetupInfo) => void | Promise<void>;
  /** Browser-only setup for the SPA adapter (bundled into the client). */
  setupBrowser?: (ctx: DevframeBrowserContext) => void | Promise<void>;
  cli?: DevframeCliOptions;
  spa?: DevframeSpaOptions;
}
declare function defineDevframe(d: DevframeDefinition): DevframeDefinition;
//#endregion
export { ScopedClientFunctions as $, StreamSinkEvents as A, SharedStateOptions as B, RpcStreamingHost as C, EventsMap as Ct, StreamErrorPayload as D, parseCliFlags as Dt, CreateStreamSinkOptions as E, defineCliFlags as Et, ImmutableMap as F, Thenable as G, createSharedState as H, ImmutableObject as I, DevframeScopedStreamingHost as J, DevframeScopedNodeContext as K, ImmutableSet as L, createStreamSink as M, Immutable as N, StreamReader as O, ImmutableArray as P, ScopedBroadcastOptions as Q, SharedState as R, RpcStreamingChannelOptions as S, EventUnsubscribe as St, CreateStreamReaderOptions as T, InferCliFlags as Tt, EntriesToObject as U, SharedStatePatch as V, PartialWithoutId as W, DevframeSettingsRegistry as X, DevframeSettings as Y, DevframeSettingsStore as Z, RpcBroadcastOptions as _, AgentTool as _t, DevframeDuplicationStrategy as a, DevframeRpcServerFunctions as at, RpcSharedStateHost as b, DevframeAgentHostEvents as bt, DevframeSpaOptions as c, DevframeDefineDiagnosticsOptions as ct, defineDevframe as d, DevframeDiagnosticsLogger as dt, ScopedServerFunctions as et, ConnectionMeta as f, AgentHandle as ft, DevframeNodeRpcSession as g, AgentResourceInput as gt, DevframeNodeContext as h, AgentResourceContent as ht, DevframeDeploymentKind as i, DevframeRpcClientFunctions as it, createStreamReader as j, StreamSink as k, DevframeWsOptions as l, DevframeDiagnosticsDefinition as lt, DevframeCapabilities as m, AgentResource as mt, DevframeCliOptions as n, SettingsForNamespace as nt, DevframeRuntime as o, DevframeRpcSharedStates as ot, ConnectionMetaWebsocket as p, AgentManifest as pt, DevframeScopedNodeRpc as q, DevframeDefinition as r, DevframeViewHost as rt, DevframeSetupInfo as s, DevframeHost as st, DevframeBrowserContext as t, ScopedSharedStates as tt, McpRouteOptions as u, DevframeDiagnosticsHost as ut, RpcFunctionsHost as v, AgentToolInput as vt, BufferedChunk as w, CliFlagsSchema as wt, RpcStreamingChannel as x, EventEmitter as xt, RpcSharedStateGetOptions as y, DevframeAgentHost as yt, SharedStateEvents as z };
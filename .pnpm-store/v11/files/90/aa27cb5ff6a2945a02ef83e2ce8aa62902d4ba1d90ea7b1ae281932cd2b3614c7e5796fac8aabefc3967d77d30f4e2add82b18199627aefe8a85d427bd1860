import { S as DevframeMessagesClient, _ as DevframeMessageEntryInput } from "../context-CNKFzYdA.mjs";
import { b as DevframeDockUserEntry, h as DevframeDockEntry, i as DevframeCommandEntry, j as RemoteConnectionInfo, m as DevframeDockEntriesGrouped, n as DevframeClientCommand, o as DevframeCommandKeybinding, t as DevframeDocksUserSettings } from "../settings-C5cAtNdE.mjs";
import "../index-BeoLMW0z.mjs";
import { DevframeClientRpcHost, DevframeConnectionStatus, DevframeRpcClient, DevframeRpcClientOptions, DevframeRpcContext, RpcClientEvents, RpcClientEvents as RpcClientEvents$1 } from "devframe/client";
import { EventEmitter } from "devframe/types";
import { SharedState } from "devframe/utils/shared-state";
import { WhenContext } from "devframe/utils/when";
export * from "devframe/client";
//#region src/client/renderers.d.ts
/**
 * Options handed to a dock renderer when the client host mounts a dock entry.
 */
interface DockRendererMountOptions {
  /** The dock entry being rendered (carries the entry's serializable payload). */
  entry: DevframeDockEntry;
  /** The DOM element the renderer should mount into. */
  container: HTMLElement;
  /** The assembled client host context (rpc, docks, commands, …). */
  context: DevframeClientContext;
}
/** A mounted renderer instance the host can tear down. */
interface DockRendererInstance {
  /** Tear down the mounted UI and release its subscriptions. */
  dispose?: () => void;
}
/**
 * A renderer for a dock `type`. The headless hub is renderer-agnostic — a
 * host application registers renderers at boot (e.g. injecting
 * `@devframes/json-render-ui` for the `'json-render'` type). The renderer
 * owns its framework (Vue, React, …); the hub only routes a dock type to it
 * and disposes it on deactivation.
 */
type DockRenderer = (options: DockRendererMountOptions) => DockRendererInstance | Promise<DockRendererInstance>;
/**
 * The dock-renderer registry surfaced on the client host context. A viewer
 * calls {@link DockRenderersContext.mount} to render a dock whose `type` has a
 * registered renderer into a container it owns; the host tracks the instance
 * and disposes it when the entry deactivates.
 */
interface DockRenderersContext {
  /** Register a renderer for a dock `type`. Returns an unregister function. */
  register: (type: string, renderer: DockRenderer) => () => void;
  /** Look up the renderer registered for a dock `type`, if any. */
  get: (type: string) => DockRenderer | undefined;
  /** Whether a renderer is registered for a dock `type`. */
  has: (type: string) => boolean;
  /**
   * Mount the entry's registered renderer into `container`. Resolves to a
   * disposer; the same instance is also disposed automatically when the entry
   * deactivates. Warns and resolves to a no-op disposer when no renderer is
   * registered for the entry's type.
   */
  mount: (entry: DevframeDockEntry, container: HTMLElement) => Promise<() => void>;
}
//#endregion
//#region src/client/docks.d.ts
interface DockPanelStorage {
  mode: 'float' | 'edge';
  width: number;
  height: number;
  top: number;
  left: number;
  position: 'left' | 'right' | 'bottom' | 'top';
  open: boolean;
  inactiveTimeout: number;
}
type DockClientType = 'embedded' | 'standalone';
interface DocksContext extends DevframeRpcContext {
  /**
   * Type of the client environment
   *
   * 'embedded' - running inside an embedded floating panel
   * 'standalone' - running inside a standalone window (no user app)
   */
  readonly clientType: 'embedded' | 'standalone';
  /**
   * The panel context
   */
  readonly panel: DocksPanelContext;
  /**
   * The docks entries context
   */
  readonly docks: DocksEntriesContext;
  /**
   * The commands context for command palette and shortcuts
   */
  readonly commands: CommandsContext;
  /**
   * The when-clause context for conditional visibility
   */
  readonly when: WhenClauseContext;
  /**
   * The live connection status of the underlying devframe client, so a viewer
   * can render one central connection indicator for every docked plugin
   * instead of each plugin surfacing its own.
   */
  readonly connection: DocksConnectionContext;
  /**
   * The dock-renderer registry. Routes a dock `type` to a host-registered
   * renderer (e.g. `@devframes/json-render-ui` for `'json-render'`). The hub
   * itself ships no renderers.
   */
  readonly renderers: DockRenderersContext;
}
interface DocksConnectionContext {
  /** The current connection status. */
  readonly status: DevframeConnectionStatus;
  /** The most recent connection-level error, or `null` when healthy. */
  readonly error: Error | null;
  /**
   * The client's event emitter — subscribe to `connection:status`,
   * `connection:error`, and `rpc:error` to react to changes.
   */
  readonly events: EventEmitter<RpcClientEvents$1>;
}
interface WhenClauseContext {
  /**
   * Get the current when-clause context snapshot.
   * Returns a reactive object with built-in variables and any custom plugin variables.
   */
  readonly context: WhenContext;
}
type DevframeClientContext = DocksContext;
interface DocksPanelContext {
  store: DockPanelStorage;
  isDragging: boolean;
  isResizing: boolean;
  readonly isVertical: boolean;
}
interface DocksEntriesContext {
  selectedId: string | null;
  readonly selected: DevframeDockEntry | null;
  entries: DevframeDockEntry[];
  entryToStateMap: Map<string, DockEntryState>;
  groupedEntries: DevframeDockEntriesGrouped;
  settings: SharedState<DevframeDocksUserSettings>;
  /**
   * Get the state of a dock entry by its ID
   */
  getStateById: (id: string) => DockEntryState | undefined;
  /**
   * Switch to the selected dock entry, pass `null` to clear the selection
   *
   * @returns Whether the selection was changed successfully
   */
  switchEntry: (id?: string | null) => Promise<boolean>;
  /**
   * Toggle the selected dock entry
   *
   * @returns Whether the selection was changed successfully
   */
  toggleEntry: (id: string) => Promise<boolean>;
}
interface DockEntryState {
  entryMeta: DevframeDockEntry;
  readonly isActive: boolean;
  domElements: {
    iframe?: HTMLIFrameElement | null;
    panel?: HTMLDivElement | null;
  };
  events: EventEmitter<DockEntryStateEvents>;
}
interface DockEntryStateEvents {
  'entry:activated': () => void;
  'entry:deactivated': () => void;
  'entry:updated': (newMeta: DevframeDockUserEntry) => void;
  'dom:panel:mounted': (panel: HTMLDivElement) => void;
  'dom:iframe:mounted': (iframe: HTMLIFrameElement) => void;
}
interface CommandsContext {
  /**
   * All commands (server + client)
   */
  readonly commands: DevframeCommandEntry[];
  /**
   * Palette-visible commands only (filtered by `showInPalette !== false`)
   */
  readonly paletteCommands: DevframeCommandEntry[];
  /**
   * Register client-side command(s). Returns cleanup function.
   */
  register: (cmd: DevframeClientCommand | DevframeClientCommand[]) => () => void;
  /**
   * Execute a command by ID. Delegates to RPC for server commands.
   */
  execute: (id: string, ...args: any[]) => Promise<unknown>;
  /**
   * Get effective keybindings for a command (defaults merged with overrides)
   */
  getKeybindings: (id: string) => DevframeCommandKeybinding[];
  /**
   * User settings store (persisted, includes command shortcuts)
   */
  settings: SharedState<DevframeDocksUserSettings>;
  /**
   * Whether the command palette is open
   */
  paletteOpen: boolean;
}
//#endregion
//#region src/client/client-script.d.ts
/**
 * Context for client scripts running in dock entries
 */
interface DockClientScriptContext extends DocksContext {
  /**
   * The state of the current dock entry
   */
  current: DockEntryState;
  /**
   * Messages client scoped to this dock entry — messages it adds default
   * their `category` to the entry id, so the feed can attribute them.
   */
  messages: DevframeMessagesClient;
}
//#endregion
//#region src/client/context.d.ts
declare const CLIENT_CONTEXT_KEY = "__DEVFRAME_HUB_CLIENT_CONTEXT__";
/**
 * Get the global Devframe client context, or `undefined` if not yet initialized.
 */
declare function getDevframeClientContext(): DevframeClientContext | undefined;
/**
 * Publish the global Devframe client context (or clear it with `undefined`).
 * Called by {@link import('./host').createDevframeClientHost}; a dock client
 * script or a viewer reads it back with {@link getDevframeClientContext}.
 */
declare function setDevframeClientContext(ctx: DevframeClientContext | undefined): void;
//#endregion
//#region src/client/host.d.ts
interface DevframeClientHostOptions {
  /**
   * An already-connected RPC client. When omitted, one is created via
   * `connectDevframe(connect)` — pass `connect.baseURL` to point at the hub's
   * connection-meta mount (e.g. `/__hub/`).
   */
  rpc?: DevframeRpcClient;
  /** Options forwarded to `connectDevframe` when `rpc` is not supplied. */
  connect?: DevframeRpcClientOptions;
  /**
   * Environment the host runs in.
   * - `'standalone'` (default) — the runtime owns the whole page (a hub UI).
   * - `'embedded'` — the runtime lives inside a user app alongside a panel.
   */
  clientType?: DockClientType;
  /**
   * Import and run the client scripts declared on dock entries (`action`,
   * `custom-render`, and iframe `clientScript`). Default `true`.
   */
  loadClientScripts?: boolean;
  /**
   * Dock renderers to register at boot, keyed by dock `type`. The host
   * application injects the ones it wants (e.g.
   * `{ 'json-render': createJsonRenderDockRenderer() }` from
   * `@devframes/json-render-ui`). The hub ships none by default.
   */
  renderers?: Record<string, DockRenderer>;
}
interface DevframeClientHost {
  /** The assembled, globally-registered client host context. */
  context: DevframeClientContext;
  /** Tear down listeners and stop tracking newly-registered client scripts. */
  dispose: () => void;
}
/**
 * Boot the framework-level client host: connect RPC, assemble the full
 * {@link DevframeClientContext} (panel, docks, commands, when) from the hub's
 * shared state, publish it at `__DEVFRAME_HUB_CLIENT_CONTEXT__`, and load every
 * dock entry's client script into this page — the devframe equivalent of the
 * runtime `@vitejs/devtools-kit` injects into a host app.
 *
 * A viewer keeps rendering its own dock UI (reading the same shared state); this
 * runtime is what gives plugin client scripts a live host context to run in.
 */
declare function createDevframeClientHost(options?: DevframeClientHostOptions): Promise<DevframeClientHost>;
//#endregion
//#region src/client/messages.d.ts
interface MessagesClientOptions {
  /**
   * Default fields merged beneath every `add()` input — the client host passes
   * `{ category: entry.id }` to scope a dock client script's messages to its
   * entry. Fields set on the input itself win.
   */
  defaults?: Partial<DevframeMessageEntryInput>;
}
/**
 * Build a browser-side {@link DevframeMessagesClient} that writes into the
 * hub's messages subsystem over the `hub:messages:*` built-in RPCs. The handle
 * returned by `add` proxies `update`/`dismiss` back through the same RPCs, so a
 * dock client script reports into the very feed the server writes to.
 */
declare function createMessagesClient(rpc: DevframeRpcClient, options?: MessagesClientOptions): DevframeMessagesClient;
//#endregion
//#region src/client/remote.d.ts
type ConnectRemoteDevframeOptions = Omit<DevframeRpcClientOptions, 'connectionMeta' | 'authToken'>;
/**
 * Parse a {@link RemoteConnectionInfo} descriptor from the current page's URL
 * (or a provided URL/string). Checks the URL fragment first, then the query.
 *
 * Returns `null` if no descriptor is present.
 * Throws if the descriptor is malformed or its schema version is unsupported.
 */
declare function parseRemoteConnection(input?: string): RemoteConnectionInfo | null;
/**
 * One-liner for a hosted Devframe page: reads the connection descriptor from
 * the current URL and returns a connected {@link DevframeRpcClient}.
 *
 * Pairs with `remote: true` on a `DevframeViewIframe` registered on the node
 * side — the hub injects the descriptor into the iframe URL.
 *
 * @throws if no descriptor is present in the URL.
 */
declare function connectRemoteDevframe(options?: ConnectRemoteDevframeOptions): Promise<DevframeRpcClient>;
//#endregion
export { CLIENT_CONTEXT_KEY, CommandsContext, ConnectRemoteDevframeOptions, DevframeClientContext, DevframeClientHost, DevframeClientHostOptions, type DevframeClientRpcHost, DockClientScriptContext, DockClientType, DockEntryState, DockEntryStateEvents, DockPanelStorage, DockRenderer, DockRendererInstance, DockRendererMountOptions, DockRenderersContext, DocksConnectionContext, DocksContext, DocksEntriesContext, DocksPanelContext, MessagesClientOptions, type RpcClientEvents, WhenClauseContext, connectRemoteDevframe, createDevframeClientHost, createMessagesClient, getDevframeClientContext, parseRemoteConnection, setDevframeClientContext };
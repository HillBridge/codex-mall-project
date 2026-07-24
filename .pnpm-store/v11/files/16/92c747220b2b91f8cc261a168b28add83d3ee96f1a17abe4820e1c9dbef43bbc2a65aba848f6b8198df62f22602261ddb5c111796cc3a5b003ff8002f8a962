import { ConnectionMeta, EventEmitter } from "devframe/types";
//#region src/types/json-render.d.ts
/** @deprecated Use `DevframeJsonRenderSpec`'s element shape from `@devframes/json-render` instead. Removed in 0.8. */
interface JsonRenderElement {
  type: string;
  props?: Record<string, unknown>;
  children?: string[];
  /** json-render event bindings (e.g. `{ press: { action: "my:action" } }`) */
  on?: Record<string, unknown>;
  /** json-render visibility condition */
  visible?: unknown;
  /** json-render repeat binding */
  repeat?: unknown;
  /** Allow additional json-render element fields */
  [key: string]: unknown;
}
/** @deprecated Use `DevframeJsonRenderSpec` from `@devframes/json-render` instead. Removed in 0.8. */
interface JsonRenderSpec {
  root: string;
  elements: Record<string, JsonRenderElement>;
  /** Initial client-side state model for $state/$bindState expressions */
  state?: Record<string, unknown>;
}
/** @deprecated Use `JsonRenderView` from `@devframes/json-render` instead. Removed in 0.8. */
interface JsonRenderer {
  /** Replace the entire spec */
  updateSpec: (spec: JsonRenderSpec) => void | Promise<void>;
  /** Update json-render state values (shallow merge into spec.state) */
  updateState: (state: Record<string, unknown>) => void | Promise<void>;
  /** Internal: shared state key used by the client to subscribe */
  readonly _stateKey: string;
}
//#endregion
//#region src/types/docks.d.ts
interface DevframeDocksHost {
  readonly views: Map<string, DevframeDockUserEntry>;
  readonly events: EventEmitter<{
    'dock:entry:updated': (entry: DevframeDockUserEntry) => void;
    'dock:activate': (activation: DevframeDockActivation) => void;
  }>;
  register: <T extends DevframeDockUserEntry>(entry: T, force?: boolean) => {
    update: (patch: Partial<T>) => void;
  };
  update: (entry: DevframeDockUserEntry) => void;
  values: () => DevframeDockEntry[];
  /**
   * Request the active viewer switch its focused dock to `dockId`, optionally
   * carrying `params` for the target dock to interpret (e.g. a terminals
   * session id).
   *
   * Any connected client may drive this via the `hub:docks:activate` RPC — a
   * mounted devframe running in its own iframe can steer the host shell's dock
   * selection, which is otherwise client-local. The request is delivered live
   * to connected clients (broadcast) and mirrored into the
   * `devframe:docks:active` shared state so a dock that mounts in response
   * still sees it. Activation is best-effort: unknown dock ids degrade
   * gracefully.
   */
  activate: (dockId: string, params?: Record<string, unknown>) => void;
}
/**
 * A request to switch the active dock. `params` is an opaque, serializable
 * bag the target dock interprets — the terminals dock reads `params.sessionId`
 * to focus a specific session.
 */
interface DevframeDockActivation {
  dockId: string;
  params?: Record<string, unknown>;
}
/**
 * Shape of the `devframe:docks:active` shared-state slot — the most recent
 * {@link DevframeDockActivation}, or `null` before any activation. Mirrored
 * so a dock that mounts in response to an activation can still converge on the
 * request instead of missing the live broadcast.
 */
interface DevframeDocksActiveState {
  activation: DevframeDockActivation | null;
}
type DevframeDockEntryCategory = 'app' | 'framework' | 'web' | 'advanced' | 'default' | '~builtin' | (string & {});
type DevframeDockEntryIcon = string | {
  light: string;
  dark: string;
};
interface DevframeDockEntryBase {
  id: string;
  title: string;
  icon: DevframeDockEntryIcon;
  /**
   * The default order of the entry in the dock.
   * The higher the number the earlier it appears.
   * @default 0
   */
  defaultOrder?: number;
  /**
   * The category of the entry
   * @default 'default'
   */
  category?: DevframeDockEntryCategory;
  /**
   * Conditional visibility expression.
   * When set, the dock entry is only visible when the expression evaluates to true.
   * Uses the same syntax as command `when` clauses.
   *
   * Set to `'false'` to unconditionally hide the entry.
   *
   * @example 'clientType == embedded'
   * @see {@link import('devframe/utils/when').evaluateWhen}
   */
  when?: string;
  /**
   * Badge text to display on the dock icon (e.g., unread count)
   */
  badge?: string;
  /**
   * Id of the group this entry belongs to. When set, hosts collapse this entry
   * under the matching group's button instead of showing it directly on the
   * dock bar.
   *
   * This is a flat pointer — membership, not containment. The entry stays an
   * independently-registered, top-level entry; only its rendering is grouped
   * downstream. If the referenced group is never registered, the entry renders
   * as a normal top-level entry (orphan tolerance).
   *
   * @see {@link DevframeViewGroup}
   */
  groupId?: string;
}
interface ClientScriptEntry {
  /**
   * The filepath or module name to import from
   */
  importFrom: string;
  /**
   * The name to import the module as
   *
   * @default 'default'
   */
  importName?: string;
}
interface DevframeViewIframe extends DevframeDockEntryBase {
  type: 'iframe';
  url: string;
  /**
   * The id of the iframe, if multiple tabs is assigned with the same id, the iframe will be shared.
   *
   * When not provided, it would be treated as a unique frame.
   */
  frameId?: string;
  /**
   * Optional client script to import into the iframe
   */
  clientScript?: ClientScriptEntry;
  /**
   * Enable remote-UI mode: the hub injects a connection descriptor
   * (WS URL + pre-approved auth token) into the iframe URL so a hosted
   * page can connect back via `connectRemoteDevframe()` from
   * `@devframes/hub/client` — without needing to ship a dist with the
   * plugin.
   *
   * Requires dev mode (no effect in build mode — no WS server exists).
   * When enabled, the dock is automatically hidden in build mode unless
   * the author provides an explicit `when` clause.
   */
  remote?: boolean | RemoteDockOptions;
}
interface RemoteDockOptions {
  /**
   * How to pass the connection descriptor to the hosted page.
   *
   * - `'fragment'` (default): appended as a URL fragment.
   *   Not sent in HTTP requests or Referer headers — safest for auth tokens.
   * - `'query'`: appended as a URL query parameter. Use when your hosting
   *   platform rewrites fragments or your SPA router repurposes the fragment
   *   for navigation. The token will appear in server access logs and
   *   outbound Referer headers.
   *
   * @default 'fragment'
   */
  transport?: 'fragment' | 'query';
  /**
   * Reject WS handshakes whose `Origin` header doesn't match the dock URL
   * origin. Turn off when the same hosted app is served from multiple
   * origins (e.g. preview deploys).
   *
   * @default true
   */
  originLock?: boolean;
}
interface RemoteConnectionInfo extends ConnectionMeta {
  backend: 'websocket';
  websocket: string;
  v: 1;
  authToken: string;
  origin: string;
}
type DevframeViewLauncherStatus = 'idle' | 'loading' | 'success' | 'error';
interface DevframeViewLauncher extends DevframeDockEntryBase {
  type: 'launcher';
  launcher: {
    icon?: DevframeDockEntryIcon;
    title: string;
    status?: DevframeViewLauncherStatus;
    error?: string;
    description?: string;
    buttonStart?: string;
    buttonLoading?: string;
    /**
     * Bound command id: the launch button, command palette entry, and any
     * keybinding all resolve to this one handler. A viewer running out of
     * process dispatches it over the `hub:commands:execute` RPC — the
     * serializable path {@link onLaunch} can't cross, since a function is
     * dropped when the entry is projected into the `devframe:docks` shared
     * state. Register the command (with its handler) via `ctx.commands`.
     */
    command?: string;
    /**
     * Id of the terminal session this launcher tracks (e.g. the one returned
     * by `ctx.terminals.startChildProcess`). A viewer surfaces a first-class
     * "view in terminal" action that calls `hub:docks:activate` with the
     * terminals dock id and `{ sessionId: terminalSessionId }`, jumping the
     * user straight to the running process.
     */
    terminalSessionId?: string;
    /**
     * Latest single line of progress for inline display beneath the launcher
     * (e.g. the tail of the tracked session's output). Author-set: the owner
     * patches it via `docks.update()` as the process reports progress.
     */
    digest?: string;
    /**
     * In-process launch handler. Optional: a same-process host can invoke it
     * directly, but it does not survive projection into shared state, so an
     * out-of-process viewer relies on {@link command} instead. Provide one or
     * both.
     */
    onLaunch?: () => Promise<void>;
  };
}
interface DevframeViewAction extends DevframeDockEntryBase {
  type: 'action';
  action: ClientScriptEntry;
}
interface DevframeViewCustomRender extends DevframeDockEntryBase {
  type: 'custom-render';
  renderer: ClientScriptEntry;
}
/**
 * A view rendered natively by the viewer rather than by a plugin — the
 * settings panel, the terminals feed, the messages feed, etc. A high-level
 * integration registers the built-in views it wants; the viewer recognizes the
 * reserved `id` and renders its own UI for it.
 *
 * Its {@link DevframeDockEntryBase.category} defaults to `'~builtin'` when
 * omitted, so built-in views group together and sort last without every
 * integration repeating it.
 */
interface DevframeViewBuiltin extends DevframeDockEntryBase {
  type: '~builtin';
  id: string;
}
/**
 * @deprecated json-render moved out of the hub into the opt-in
 * `@devframes/json-render` integration in 0.7, which contributes its own
 * `'json-render'` entry (carrying a serializable view ref, not a live
 * `JsonRenderer` handle) to {@link DevframeDockEntryRegistry} via declaration
 * merging. This type is kept for compatibility but is no longer a member of
 * {@link DevframeDockUserEntry} — use `@devframes/json-render/hub` instead.
 * Removed in 0.8.
 */
interface DevframeViewJsonRender extends DevframeDockEntryBase {
  type: 'json-render';
  /** JsonRenderer handle created by the deprecated ctx.createJsonRenderer() */
  ui: JsonRenderer;
}
/**
 * A dock group: a single dock-bar button that collapses every entry whose
 * {@link DevframeDockEntryBase.groupId} matches this group's `id`.
 *
 * A group carries its own `title`/`icon`/`category`/`defaultOrder`/`when`
 * (inherited from {@link DevframeDockEntryBase}) and has no view payload of its
 * own — hosts render its members in a popover / sub-navigation. It flows
 * through the same `register`/`update`/`values` machinery as every other entry,
 * keyed by `id`.
 *
 * Grouping is one level deep: a group entry must not itself set `groupId`.
 */
interface DevframeViewGroup extends DevframeDockEntryBase {
  type: 'group';
  /**
   * Member id auto-opened when the group button is activated. When unset,
   * activating the group only reveals its members (popover-only); no view
   * opens until a member is chosen.
   */
  defaultChildId?: string;
}
/**
 * The **open** registry of dock entry variants, keyed by their `type`
 * discriminator. The hub ships the framework-neutral built-ins; opt-in
 * integrations contribute their own variants through declaration merging —
 * e.g. `@devframes/json-render/hub` adds a `'json-render'` entry. The hub
 * itself stays agnostic: it hard-codes no integration-specific variant.
 *
 * @example
 * ```ts
 * // in an opt-in integration package
 * declare module '@devframes/hub/types' {
 *   interface DevframeDockEntryRegistry {
 *     'my-view': MyDockEntry
 *   }
 * }
 * ```
 */
interface DevframeDockEntryRegistry {
  'iframe': DevframeViewIframe;
  'action': DevframeViewAction;
  'custom-render': DevframeViewCustomRender;
  'launcher': DevframeViewLauncher;
  'group': DevframeViewGroup;
  '~builtin': DevframeViewBuiltin;
}
type DevframeDockUserEntry = DevframeDockEntryRegistry[keyof DevframeDockEntryRegistry];
type DevframeDockEntry = DevframeDockUserEntry;
type DevframeDockEntriesGrouped = [category: string, entries: DevframeDockEntry[]][];
//#endregion
//#region src/types/commands.d.ts
interface DevframeCommandKeybinding {
  /**
   * Keyboard shortcut string.
   * Use "Mod" for platform-aware modifier (Cmd on macOS, Ctrl elsewhere).
   * Examples: "Mod+K", "Mod+Shift+P", "Alt+N"
   */
  key: string;
}
interface DevframeCommandBase {
  /**
   * Unique namespaced ID, e.g. "vite:open-in-editor"
   */
  id: string;
  title: string;
  description?: string;
  /**
   * Icon for the command. Either an Iconify icon string (e.g. "ph:pencil-duotone")
   * or a theme-specific pair `{ light, dark }` — the same shape as dock icons.
   */
  icon?: DevframeDockEntryIcon;
  category?: string;
  /**
   * Whether to show in command palette. Default: true
   *
   * - `true` — show the command and flatten its children into search results
   * - `false` — hide the command entirely from the palette
   * - `'without-children'` — show the command but don't flatten children into top-level search (children are still accessible via drill-down)
   */
  showInPalette?: boolean | 'without-children';
  /**
   * Optional context expression for conditional visibility.
   * When set, the command is only shown in the palette and only executable
   * when the expression evaluates to true.
   */
  when?: string;
  /**
   * Default keyboard shortcut(s) for this command
   */
  keybindings?: DevframeCommandKeybinding[];
}
/**
 * Server command input — what plugins pass to `ctx.commands.register()`.
 */
interface DevframeServerCommandInput extends DevframeCommandBase {
  /**
   * Handler for this command. Optional if the command only serves as a group for children.
   */
  handler?: (...args: any[]) => any | Promise<any>;
  /**
   * Static sub-commands. Two levels max (parent → children).
   * Each child must have a globally unique `id`.
   */
  children?: DevframeServerCommandInput[];
}
/**
 * Serializable server command entry — sent over RPC (no handler).
 */
interface DevframeServerCommandEntry extends DevframeCommandBase {
  source: 'server';
  children?: DevframeServerCommandEntry[];
}
/**
 * Client command — registered in the webcomponent context.
 */
interface DevframeClientCommand extends DevframeCommandBase {
  source: 'client';
  /**
   * Action for this command. Optional if the command only serves as a group for children.
   * Return sub-commands for dynamic nested palette menus (runtime submenus).
   */
  action?: (...args: any[]) => void | DevframeClientCommand[] | Promise<void | DevframeClientCommand[]>;
  /**
   * Static sub-commands. Two levels max (parent → children).
   */
  children?: DevframeClientCommand[];
}
/**
 * Union of command entries visible in the palette.
 */
type DevframeCommandEntry = DevframeServerCommandEntry | DevframeClientCommand;
interface DevframeCommandHandle {
  readonly id: string;
  update: (patch: Partial<Omit<DevframeServerCommandInput, 'id'>>) => void;
  unregister: () => void;
}
interface DevframeCommandsHostEvents {
  'command:registered': (command: DevframeServerCommandEntry) => void;
  'command:unregistered': (id: string) => void;
}
interface DevframeCommandsHost {
  readonly commands: Map<string, DevframeServerCommandInput>;
  readonly events: EventEmitter<DevframeCommandsHostEvents>;
  /**
   * Register a command (with optional children).
   */
  register: (command: DevframeServerCommandInput) => DevframeCommandHandle;
  /**
   * Unregister a command by ID (removes parent and all children).
   */
  unregister: (id: string) => boolean;
  /**
   * Execute a command by ID. Searches top-level and children.
   * Throws if not found or if command has no handler.
   */
  execute: (id: string, ...args: any[]) => Promise<unknown>;
  /**
   * Returns serializable list (no handlers), preserving tree structure.
   */
  list: () => DevframeServerCommandEntry[];
}
interface DevframeCommandShortcutOverrides {
  /**
   * Command ID → keybinding overrides. Empty array = shortcut disabled.
   */
  [commandId: string]: DevframeCommandKeybinding[];
}
//#endregion
//#region src/types/settings.d.ts
interface DevframeDocksUserSettings {
  docksHidden: string[];
  docksCategoriesHidden: string[];
  docksPinned: string[];
  docksCustomOrder: Record<string, number>;
  showIframeAddressBar: boolean;
  closeOnOutsideClick: boolean;
  commandShortcuts: DevframeCommandShortcutOverrides;
}
//#endregion
export { DevframeViewLauncherStatus as A, DevframeViewAction as C, DevframeViewIframe as D, DevframeViewGroup as E, JsonRenderer as F, RemoteDockOptions as M, JsonRenderElement as N, DevframeViewJsonRender as O, JsonRenderSpec as P, DevframeDocksHost as S, DevframeViewCustomRender as T, DevframeDockEntryCategory as _, DevframeCommandHandle as a, DevframeDockUserEntry as b, DevframeCommandsHost as c, DevframeServerCommandInput as d, ClientScriptEntry as f, DevframeDockEntryBase as g, DevframeDockEntry as h, DevframeCommandEntry as i, RemoteConnectionInfo as j, DevframeViewLauncher as k, DevframeCommandsHostEvents as l, DevframeDockEntriesGrouped as m, DevframeClientCommand as n, DevframeCommandKeybinding as o, DevframeDockActivation as p, DevframeCommandBase as r, DevframeCommandShortcutOverrides as s, DevframeDocksUserSettings as t, DevframeServerCommandEntry as u, DevframeDockEntryIcon as v, DevframeViewBuiltin as w, DevframeDocksActiveState as x, DevframeDockEntryRegistry as y };
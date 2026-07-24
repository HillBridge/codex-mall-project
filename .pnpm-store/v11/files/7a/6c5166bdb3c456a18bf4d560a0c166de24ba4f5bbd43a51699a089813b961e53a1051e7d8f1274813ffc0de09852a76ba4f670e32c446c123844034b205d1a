import { DEFAULT_CATEGORIES_ORDER, DEFAULT_STATE_USER_SETTINGS } from "../constants.mjs";
import { REMOTE_CONNECTION_KEY } from "devframe/constants";
import { connectDevframe, getDevframeRpcClient } from "devframe/client";
import { createEventEmitter } from "devframe/utils/events";
import { destr } from "destr";
export * from "devframe/client";
//#region src/client/context.ts
const CLIENT_CONTEXT_KEY = "__DEVFRAME_HUB_CLIENT_CONTEXT__";
/**
* Get the global Devframe client context, or `undefined` if not yet initialized.
*/
function getDevframeClientContext() {
	return globalThis[CLIENT_CONTEXT_KEY];
}
/**
* Publish the global Devframe client context (or clear it with `undefined`).
* Called by {@link import('./host').createDevframeClientHost}; a dock client
* script or a viewer reads it back with {@link getDevframeClientContext}.
*/
function setDevframeClientContext(ctx) {
	globalThis[CLIENT_CONTEXT_KEY] = ctx;
}
//#endregion
//#region src/client/messages.ts
/**
* Build a browser-side {@link DevframeMessagesClient} that writes into the
* hub's messages subsystem over the `hub:messages:*` built-in RPCs. The handle
* returned by `add` proxies `update`/`dismiss` back through the same RPCs, so a
* dock client script reports into the very feed the server writes to.
*/
function createMessagesClient(rpc, options = {}) {
	const { call } = rpc;
	function makeHandle(entry) {
		let current = entry;
		return {
			get entry() {
				return current;
			},
			get id() {
				return current.id;
			},
			async update(patch) {
				const updated = await call("hub:messages:update", current.id, patch);
				if (updated) current = updated;
				return updated;
			},
			dismiss: () => call("hub:messages:remove", current.id)
		};
	}
	async function add(input) {
		return makeHandle(await call("hub:messages:add", {
			...options.defaults,
			...input
		}));
	}
	function levelShortcut(level) {
		return (message, extra) => add({
			...extra,
			message,
			level
		});
	}
	return {
		add,
		remove: (id) => call("hub:messages:remove", id),
		clear: () => call("hub:messages:clear"),
		info: levelShortcut("info"),
		warn: levelShortcut("warn"),
		error: levelShortcut("error"),
		success: levelShortcut("success"),
		debug: levelShortcut("debug")
	};
}
//#endregion
//#region src/client/host.ts
const DOCKS_STATE_KEY = "devframe:docks";
const COMMANDS_STATE_KEY = "devframe:commands";
const USER_SETTINGS_STATE_KEY = "devframe:user-settings";
const DOCKS_ACTIVATE_EVENT = "devframe:docks:activate";
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
async function createDevframeClientHost(options = {}) {
	const clientType = options.clientType ?? "standalone";
	const rpc = options.rpc ?? await connectDevframe(options.connect);
	let mountedRenderers;
	const [docksState, commandsState, settings] = await Promise.all([
		rpc.sharedState.get(DOCKS_STATE_KEY, { initialValue: [] }),
		rpc.sharedState.get(COMMANDS_STATE_KEY, { initialValue: [] }),
		rpc.sharedState.get(USER_SETTINGS_STATE_KEY, { initialValue: DEFAULT_STATE_USER_SETTINGS() })
	]);
	let selectedId = null;
	const entryToStateMap = /* @__PURE__ */ new Map();
	const panel = createPanelContext(clientType);
	const docks = createDocksContext();
	const commands = createCommandsContext();
	const context = {
		rpc,
		clientType,
		panel,
		docks,
		commands,
		renderers: createRenderersContext(),
		when: { get context() {
			return {
				clientType,
				dockOpen: panel.store.open,
				paletteOpen: commands.paletteOpen,
				dockSelectedId: selectedId ?? ""
			};
		} },
		connection: {
			get status() {
				return rpc.status;
			},
			get error() {
				return rpc.connectionError;
			},
			events: rpc.events
		}
	};
	const disposers = [];
	reconcileEntries();
	disposers.push(docksState.on("updated", reconcileEntries));
	const activateHandler = (activation) => {
		if (activation?.dockId) switchEntry(activation.dockId);
	};
	const existingActivate = rpc.client.definitions.get(DOCKS_ACTIVATE_EVENT);
	if (existingActivate) {
		const prev = existingActivate.handler;
		existingActivate.handler = (...args) => {
			activateHandler(args[0]);
			return prev?.(...args);
		};
	} else rpc.client.register({
		name: DOCKS_ACTIVATE_EVENT,
		type: "action",
		handler: (activation) => activateHandler(activation)
	});
	if (getDevframeClientContext()) console.warn("[@devframes/hub] A client host context is already published on this page — replacing it. Boot createDevframeClientHost() once per page (e.g. HTML injection combined with a manual import boots it twice).");
	setDevframeClientContext(context);
	const loadedScripts = /* @__PURE__ */ new Set();
	if (options.loadClientScripts ?? true) {
		loadClientScripts();
		disposers.push(docksState.on("updated", loadClientScripts));
	}
	return {
		context,
		dispose() {
			for (const off of disposers.splice(0)) off();
			if (mountedRenderers) for (const disposeMount of [...mountedRenderers]) disposeMount();
			if (getDevframeClientContext() === context) setDevframeClientContext(void 0);
		}
	};
	function createDockEntryState(entryMeta) {
		return {
			entryMeta,
			get isActive() {
				return selectedId === entryMeta.id;
			},
			domElements: {},
			events: createEventEmitter()
		};
	}
	function reconcileEntries() {
		const entries = docksState.value();
		const seen = /* @__PURE__ */ new Set();
		for (const meta of entries) {
			seen.add(meta.id);
			const existing = entryToStateMap.get(meta.id);
			if (!existing) entryToStateMap.set(meta.id, createDockEntryState(meta));
			else if (existing.entryMeta !== meta) {
				existing.entryMeta = meta;
				existing.events.emit("entry:updated", meta);
			}
		}
		for (const id of [...entryToStateMap.keys()]) if (!seen.has(id)) entryToStateMap.delete(id);
		docks.entries = entries;
		docks.groupedEntries = groupByCategory(entries);
		if (selectedId && !entryToStateMap.has(selectedId)) selectedId = null;
	}
	function createDocksContext() {
		return {
			get selectedId() {
				return selectedId;
			},
			set selectedId(id) {
				switchEntry(id);
			},
			get selected() {
				return selectedId && entryToStateMap.get(selectedId)?.entryMeta || null;
			},
			entries: [],
			entryToStateMap,
			groupedEntries: [],
			settings,
			getStateById: (id) => entryToStateMap.get(id),
			switchEntry,
			toggleEntry: (id) => selectedId === id ? switchEntry(null) : switchEntry(id)
		};
	}
	async function switchEntry(id) {
		const next = id ?? null;
		if (next === selectedId) return false;
		if (next !== null && !entryToStateMap.has(next)) return false;
		const previous = selectedId;
		selectedId = next;
		if (previous) entryToStateMap.get(previous)?.events.emit("entry:deactivated");
		if (next) entryToStateMap.get(next)?.events.emit("entry:activated");
		return true;
	}
	function createCommandsContext() {
		const clientCommands = /* @__PURE__ */ new Map();
		function allCommands() {
			return [...commandsState.value(), ...clientCommands.values()];
		}
		return {
			get commands() {
				return allCommands();
			},
			get paletteCommands() {
				return allCommands().filter((c) => c.showInPalette !== false);
			},
			register(input) {
				const list = Array.isArray(input) ? input : [input];
				for (const cmd of list) clientCommands.set(cmd.id, cmd);
				return () => {
					for (const cmd of list) clientCommands.delete(cmd.id);
				};
			},
			async execute(id, ...args) {
				const client = clientCommands.get(id);
				if (client?.action) return client.action(...args);
				return rpc.call("hub:commands:execute", id, ...args);
			},
			getKeybindings(id) {
				const override = settings.value().commandShortcuts?.[id];
				if (override) return override;
				return allCommands().find((c) => c.id === id)?.keybindings ?? [];
			},
			settings,
			paletteOpen: false
		};
	}
	function createRenderersContext() {
		const rendererMap = /* @__PURE__ */ new Map();
		for (const [type, renderer] of Object.entries(options.renderers ?? {})) rendererMap.set(type, renderer);
		const mountedDisposers = /* @__PURE__ */ new Set();
		mountedRenderers = mountedDisposers;
		return {
			register(type, renderer) {
				rendererMap.set(type, renderer);
				return () => {
					if (rendererMap.get(type) === renderer) rendererMap.delete(type);
				};
			},
			get: (type) => rendererMap.get(type),
			has: (type) => rendererMap.has(type),
			async mount(entry, container) {
				const renderer = rendererMap.get(entry.type);
				if (!renderer) {
					console.warn(`[@devframes/hub] no renderer registered for dock type "${entry.type}" (entry "${entry.id}")`);
					return () => {};
				}
				const instance = await renderer({
					entry,
					container,
					context
				});
				let disposed = false;
				let offDeactivate;
				const dispose = () => {
					if (disposed) return;
					disposed = true;
					mountedDisposers.delete(dispose);
					offDeactivate?.();
					instance.dispose?.();
				};
				mountedDisposers.add(dispose);
				offDeactivate = entryToStateMap.get(entry.id)?.events.on("entry:deactivated", dispose);
				return dispose;
			}
		};
	}
	function clientScriptOf(entry) {
		return entry.action ?? entry.renderer ?? entry.clientScript;
	}
	function loadClientScripts() {
		for (const entry of docksState.value()) {
			const script = clientScriptOf(entry);
			if (!script?.importFrom || loadedScripts.has(entry.id)) continue;
			loadedScripts.add(entry.id);
			runClientScript(entry.id, script);
		}
	}
	async function runClientScript(entryId, script) {
		try {
			const fn = (await import(
				/* @vite-ignore */
				/* webpackIgnore: true */
				/* turbopackIgnore: true */
				script.importFrom
))[script.importName ?? "default"];
			if (typeof fn !== "function") return;
			const current = entryToStateMap.get(entryId);
			if (!current) return;
			const messages = createMessagesClient(rpc, { defaults: { category: entryId } });
			await fn({
				...context,
				current,
				messages
			});
		} catch (error) {
			loadedScripts.delete(entryId);
			console.error(`[@devframes/hub] failed to load client script for "${entryId}" from ${script.importFrom}`, error);
		}
	}
}
function createPanelContext(clientType) {
	const store = {
		mode: "edge",
		width: 480,
		height: 360,
		top: 0,
		left: 0,
		position: "right",
		open: clientType === "standalone",
		inactiveTimeout: 0
	};
	return {
		store,
		isDragging: false,
		isResizing: false,
		get isVertical() {
			return store.position === "left" || store.position === "right";
		}
	};
}
function groupByCategory(entries) {
	const groups = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const category = entry.category ?? "default";
		let list = groups.get(category);
		if (!list) {
			list = [];
			groups.set(category, list);
		}
		list.push(entry);
	}
	return [...groups.entries()].sort(([a], [b]) => (DEFAULT_CATEGORIES_ORDER[a] ?? 0) - (DEFAULT_CATEGORIES_ORDER[b] ?? 0));
}
//#endregion
//#region src/client/remote.ts
function base64UrlDecode(value) {
	const padLen = (4 - value.length % 4) % 4;
	const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return new TextDecoder().decode(bytes);
}
function extractKeyFromFragment(hash) {
	if (!hash) return null;
	const raw = hash.startsWith("#") ? hash.slice(1) : hash;
	const queryIdx = raw.indexOf("?");
	if (queryIdx !== -1) {
		const value = new URLSearchParams(raw.slice(queryIdx + 1)).get(REMOTE_CONNECTION_KEY);
		if (value) return value;
	}
	for (const part of raw.split("&")) {
		const [k, v = ""] = part.split("=");
		if (k === REMOTE_CONNECTION_KEY) return decodeURIComponent(v);
	}
	return null;
}
function extractKeyFromQuery(search) {
	if (!search) return null;
	return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(REMOTE_CONNECTION_KEY);
}
/**
* Parse a {@link RemoteConnectionInfo} descriptor from the current page's URL
* (or a provided URL/string). Checks the URL fragment first, then the query.
*
* Returns `null` if no descriptor is present.
* Throws if the descriptor is malformed or its schema version is unsupported.
*/
function parseRemoteConnection(input) {
	let hash = "";
	let search = "";
	if (input === void 0) {
		if (typeof location === "undefined") return null;
		hash = location.hash;
		search = location.search;
	} else try {
		const parsed = new URL(input, "http://_");
		hash = parsed.hash;
		search = parsed.search;
	} catch {
		if (input.startsWith("#")) hash = input;
		else if (input.startsWith("?")) search = input;
		else return null;
	}
	const encoded = extractKeyFromFragment(hash) ?? extractKeyFromQuery(search);
	if (!encoded) return null;
	let payload;
	try {
		payload = destr(base64UrlDecode(encoded), { strict: true });
	} catch (cause) {
		throw new Error("[@devframes/hub] Failed to decode remote connection descriptor.", { cause });
	}
	if (!payload || typeof payload !== "object") throw new Error("[@devframes/hub] Remote connection descriptor must be an object.");
	const info = payload;
	if (info.v !== 1) throw new Error(`[@devframes/hub] Unsupported remote connection descriptor version: ${String(info.v)}`);
	if (info.backend !== "websocket" || typeof info.websocket !== "string" || !info.websocket) throw new Error("[@devframes/hub] Remote connection descriptor must carry a websocket URL.");
	if (typeof info.authToken !== "string" || !info.authToken) throw new Error("[@devframes/hub] Remote connection descriptor must carry an auth token.");
	if (typeof info.origin !== "string") throw new Error("[@devframes/hub] Remote connection descriptor must carry an origin.");
	return info;
}
/**
* One-liner for a hosted Devframe page: reads the connection descriptor from
* the current URL and returns a connected {@link DevframeRpcClient}.
*
* Pairs with `remote: true` on a `DevframeViewIframe` registered on the node
* side — the hub injects the descriptor into the iframe URL.
*
* @throws if no descriptor is present in the URL.
*/
async function connectRemoteDevframe(options = {}) {
	const info = parseRemoteConnection();
	if (!info) throw new Error("[@devframes/hub] No remote connection descriptor found in the URL. Open this page through a hub-registered dock with `remote: true`.");
	return getDevframeRpcClient({
		...options,
		connectionMeta: info,
		authToken: info.authToken
	});
}
//#endregion
export { CLIENT_CONTEXT_KEY, connectRemoteDevframe, createDevframeClientHost, createMessagesClient, getDevframeClientContext, parseRemoteConnection, setDevframeClientContext };

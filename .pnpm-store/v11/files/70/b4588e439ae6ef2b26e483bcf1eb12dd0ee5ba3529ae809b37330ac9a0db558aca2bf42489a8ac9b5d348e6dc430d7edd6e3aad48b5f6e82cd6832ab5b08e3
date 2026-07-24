import { CommandsContext, ConnectRemoteDevframeOptions as ConnectRemoteDevToolsOptions, DevframeClientContext as DevToolsClientContext, DevframeClientRpcHost as DevToolsClientRpcHost, DevframeRpcClient, DevframeRpcClient as DevToolsRpcClient, DevframeRpcClientCall as DevToolsRpcClientCall, DevframeRpcClientCallEvent as DevToolsRpcClientCallEvent, DevframeRpcClientCallOptional as DevToolsRpcClientCallOptional, DevframeRpcClientMode as DevToolsRpcClientMode, DevframeRpcClientOptions, DevframeRpcClientOptions as DevToolsRpcClientOptions, DevframeRpcContext as DevToolsRpcContext, DockClientScriptContext, DockClientType, DockEntryState, DockEntryStateEvents, DockPanelStorage, DockRenderer, DockRendererInstance, DockRendererMountOptions, DockRenderersContext, DocksContext, DocksEntriesContext, DocksPanelContext, RpcClientEvents, RpcStreamingClientHost, StreamingSubscribeOptions, WhenClauseContext, connectRemoteDevframe as connectRemoteDevTools, parseRemoteConnection } from "@devframes/hub/client";
//#region src/client/connection.d.ts
/**
 * The Vite DevTools flavour of devframe's {@link getDevframeRpcClient}. Kept as
 * a dedicated export for naming symmetry with the kit's other `DevTools*`
 * primitives.
 *
 * Vite DevTools mounts each devframe (Terminals, the Inspector, …) as a
 * same-origin iframe at its own base (e.g. `/__devframes-plugin-terminals/`).
 * Cross-base connection-meta inheritance — a child iframe reusing the parent's
 * `__connection.json` without dialing its own base's (wrong) endpoint — is
 * handled natively by devframe's client via `ConnectionMeta.baseUrl` since
 * devframe 0.7.2 (devframes/devframe#98), so no extra rewriting is needed here.
 */
declare function getDevToolsRpcClient(options?: DevframeRpcClientOptions): Promise<DevframeRpcClient>;
//#endregion
//#region src/client/context.d.ts
declare const CLIENT_CONTEXT_KEY = "__VITE_DEVTOOLS_CLIENT_CONTEXT__";
/**
 * Get the global DevTools client context, or `undefined` if not yet initialized.
 */
declare function getDevToolsClientContext(): DevToolsClientContext | undefined;
//#endregion
export { CLIENT_CONTEXT_KEY, type CommandsContext, type ConnectRemoteDevToolsOptions, type DevToolsClientContext, type DevToolsClientRpcHost, type DevToolsRpcClient, type DevToolsRpcClientCall, type DevToolsRpcClientCallEvent, type DevToolsRpcClientCallOptional, type DevToolsRpcClientMode, type DevToolsRpcClientOptions, type DevToolsRpcContext, type DockClientScriptContext, type DockClientType, type DockEntryState, type DockEntryStateEvents, type DockPanelStorage, type DockRenderer, type DockRendererInstance, type DockRendererMountOptions, type DockRenderersContext, type DocksContext, type DocksEntriesContext, type DocksPanelContext, type RpcClientEvents, type RpcStreamingClientHost, type StreamingSubscribeOptions, type WhenClauseContext, connectRemoteDevTools, getDevToolsClientContext, getDevToolsRpcClient, parseRemoteConnection };
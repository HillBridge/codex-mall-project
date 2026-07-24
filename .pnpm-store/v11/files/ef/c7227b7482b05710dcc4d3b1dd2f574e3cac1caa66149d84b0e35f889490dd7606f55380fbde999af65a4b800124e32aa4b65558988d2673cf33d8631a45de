import { Spec } from "@json-render/core";
//#region src/view-ref.d.ts
/**
 * The `@json-render/core` / `@json-render/vue` version this build of
 * `@devframes/json-render` is written and tested against. It is the sole
 * compatibility signal carried across the wire — there is no separate
 * Devframes protocol/catalog version stamp. A renderer compares its own
 * upstream version against a view's {@link JsonRenderViewRef.upstreamVersion}
 * and warns (rather than blocking) on a mismatch.
 *
 * Kept paired with the caret range on `@json-render/core` /
 * `@json-render/vue` in this package's manifest; the committed lockfile is
 * the guard against a breaking upstream upgrade.
 */
declare const JSON_RENDER_UPSTREAM_VERSION = "0.19.0";
/**
 * The serializable reference to a JSON-render view that crosses process /
 * static boundaries — e.g. projected onto a hub dock entry. It carries **no
 * functions** and no Devframes catalog version: just the shared-state key the
 * client subscribes to for the live spec + state, and the upstream version
 * the view was authored against.
 *
 * This is the corrected projection contract: the previous hub implementation
 * leaked an accidental `_stateKey` field and a non-serializable renderer
 * handle; a `JsonRenderViewRef` is a plain, fully-serializable object.
 */
interface JsonRenderViewRef {
  /** Shared-state key the client subscribes to for the live spec + state. */
  stateKey: string;
  /** Upstream `@json-render/*` version the view was authored against. */
  upstreamVersion: string;
}
//#endregion
//#region src/types.d.ts
/**
 * A Devframes JSON-render spec **is** an `@json-render/core` `Spec`: a flat
 * `root` key, an `elements` map, and optional initial `state`. This alias is
 * the Devframes-facing name; it does not add or remove fields.
 */
type DevframeJsonRenderSpec = Spec;
/**
 * A single JSON-Pointer patch to a view's `state` model. `path` is an
 * RFC 6901 JSON Pointer relative to the state root (e.g. `/count`,
 * `/user/name`). Structural spec changes replace the whole spec via
 * `update` instead.
 */
interface JsonRenderStatePatch {
  op: 'add' | 'remove' | 'replace';
  /** JSON Pointer relative to the state root, e.g. `/count`. */
  path: string;
  value?: unknown;
}
/**
 * A JSON-render view handle, returned by `createJsonRenderView`. Owns a
 * server-side shared state carrying the live spec + state, and exposes the
 * serializable {@link JsonRenderViewRef} that a hub dock (or any client
 * transport) uses to locate it.
 */
interface JsonRenderView {
  /** Author-supplied stable id, unique within the view's scope. */
  readonly id: string;
  /** Human-facing label published in the view index (defaults to `id`). */
  readonly title: string;
  /** The serializable reference clients subscribe through. */
  readonly ref: JsonRenderViewRef;
  /** Replace the entire spec (a structural change replaces the whole spec). */
  update: (spec: DevframeJsonRenderSpec) => void;
  /**
   * Apply JSON-Pointer patches to the view's `state`. Travels as a
   * shared-state patch (not a whole-spec snapshot), so only the changed
   * paths cross the wire.
   */
  patchState: (patches: JsonRenderStatePatch[]) => void;
  /** Read the current spec (immutable). */
  value: () => DevframeJsonRenderSpec;
  /** Unregister the shared state and its listeners. */
  dispose: () => void;
}
//#endregion
export { JsonRenderViewRef as i, JsonRenderView as n, JSON_RENDER_UPSTREAM_VERSION as r, DevframeJsonRenderSpec as t };
import { getIslandHash } from "../nuxt/src/app/island-hash.mjs";
import { traceAsync } from "../nuxt/src/app/internal/tracing.mjs";
import { islandCache, islandPropCache } from "../utils/cache.mjs";
import { createSSRContext } from "../utils/renderer/app.mjs";
import { getSSRRenderer } from "../utils/renderer/build-files.mjs";
import { renderInlineStyles } from "../utils/renderer/inline-styles.mjs";
import { getClientIslandResponse, getServerComponentHTML, getSlotIslandResponse } from "../utils/renderer/islands.mjs";
import { getQuery } from "ufo";
import { createError, defineEventHandler, getQuery as getQuery$1, readBody, setResponseHeader, setResponseHeaders, setResponseStatus } from "h3";
import { useNitroApp } from "nitropack/runtime";
import { destr as destr$1 } from "destr";
import { VueResolver, walkResolver } from "@unhead/vue/utils";
import { getRequestDependencies } from "vue-bundle-renderer/runtime";
import { tracingChannelNuxt } from "#internal/nuxt.config.mjs";
//#region src/runtime/handlers/island.ts
const ISLAND_SUFFIX_RE = /\.json(?:\?.*)?$/;
const handler = defineEventHandler(async (event) => {
	const nitroApp = useNitroApp();
	setResponseHeaders(event, {
		"content-type": "application/json;charset=utf-8",
		"x-powered-by": "Nuxt"
	});
	if (import.meta.prerender && event.path && await islandCache.hasItem(event.path)) return islandCache.getItem(event.path);
	const islandContext = await getIslandContext(event);
	const ssrContext = {
		...createSSRContext(event),
		islandContext,
		noSSR: false,
		url: islandContext.url
	};
	const renderer = await getSSRRenderer();
	const renderResult = await (tracingChannelNuxt ? traceAsync("nuxt.island", {
		event,
		ssrContext,
		islandContext
	}, () => renderer.renderToString(ssrContext)) : renderer.renderToString(ssrContext)).catch(async (err) => {
		if (ssrContext["~renderResponse"] && err?.message === "skipping render") return {};
		await ssrContext.nuxt?.hooks.callHook("app:error", err);
		throw err;
	});
	await ssrContext.nuxt?.hooks.callHook("app:rendered", {
		ssrContext,
		renderResult
	});
	if (ssrContext["~renderResponse"]) {
		const response = ssrContext["~renderResponse"];
		if (response.statusCode && response.statusCode >= 400) throw createError({
			statusCode: response.statusCode,
			statusMessage: response.statusMessage
		});
		return returnIslandResponse(event, response);
	}
	if (ssrContext.payload?.error) throw ssrContext.payload.error;
	const inlinedStyles = await renderInlineStyles(ssrContext.modules ?? []);
	if (inlinedStyles.length) ssrContext.head.push({ style: inlinedStyles });
	if (import.meta.dev) {
		const { styles } = getRequestDependencies(ssrContext, renderer.rendererContext);
		const link = [];
		for (const resource of Object.values(styles)) {
			if ("inline" in getQuery(resource.file)) continue;
			if (resource.file.includes("scoped") && !resource.file.includes("pages/")) link.push({
				rel: "stylesheet",
				href: renderer.rendererContext.buildAssetsURL(resource.file),
				crossorigin: ""
			});
		}
		if (link.length) ssrContext.head.push({ link });
	}
	const islandHead = {};
	for (const entry of ssrContext.head.entries.values()) for (const [key, value] of Object.entries(walkResolver(entry.input, VueResolver))) {
		const currentValue = islandHead[key];
		if (Array.isArray(currentValue)) currentValue.push(...value);
		else islandHead[key] = value;
	}
	const islandResponse = {
		id: islandContext.id,
		head: islandHead,
		html: getServerComponentHTML(renderResult.html),
		components: getClientIslandResponse(ssrContext),
		slots: getSlotIslandResponse(ssrContext)
	};
	await nitroApp.hooks.callHook("render:island", islandResponse, {
		event,
		islandContext
	});
	if (import.meta.prerender) {
		await islandCache.setItem(`/__nuxt_island/${islandContext.name}_${islandContext.id}.json`, islandResponse);
		await islandPropCache.setItem(`/__nuxt_island/${islandContext.name}_${islandContext.id}.json`, event.path);
	}
	return islandResponse;
});
function returnIslandResponse(event, response) {
	for (const header in response.headers || {}) setResponseHeader(event, header, response.headers[header]);
	if (response.statusCode) setResponseStatus(event, response.statusCode, response.statusMessage);
	return response.body;
}
const ISLAND_PATH_PREFIX = "/__nuxt_island/";
const VALID_COMPONENT_NAME_RE = /^[a-z][\w.-]*$/i;
async function getIslandContext(event) {
	let url = event.path || "";
	const islandPath = url.replace(/\?.*$/, "");
	if (import.meta.prerender && event.path && await islandPropCache.hasItem(islandPath)) url = await islandPropCache.getItem(islandPath);
	if (!url.startsWith(ISLAND_PATH_PREFIX)) throw createError({
		statusCode: 400,
		statusMessage: "Invalid island request path"
	});
	const componentParts = url.substring(15).replace(ISLAND_SUFFIX_RE, "").split("_");
	const hashId = componentParts.length > 1 ? componentParts.pop() : void 0;
	const componentName = componentParts.join("_");
	if (!componentName || !VALID_COMPONENT_NAME_RE.test(componentName)) throw createError({
		statusCode: 400,
		statusMessage: "Invalid island component name"
	});
	const rawContext = event.method === "GET" ? getQuery$1(event) : await readBody(event);
	const serializedProps = typeof rawContext?.props === "string" ? rawContext.props : "{}";
	const clientContext = {};
	if (rawContext && typeof rawContext === "object") {
		for (const key in rawContext) if (key !== "props") clientContext[key] = rawContext[key];
	}
	const expectedHash = getIslandHash({
		name: componentName,
		props: serializedProps,
		context: clientContext
	});
	if (!hashId || hashId !== expectedHash) throw createError({
		statusCode: 400,
		statusMessage: "Invalid island request hash"
	});
	const parsedProps = destr$1(serializedProps) || {};
	return {
		url: typeof rawContext?.url === "string" ? rawContext.url : "/",
		id: hashId,
		name: componentName,
		props: parsedProps,
		slots: {},
		components: {}
	};
}
//#endregion
export { handler as default };

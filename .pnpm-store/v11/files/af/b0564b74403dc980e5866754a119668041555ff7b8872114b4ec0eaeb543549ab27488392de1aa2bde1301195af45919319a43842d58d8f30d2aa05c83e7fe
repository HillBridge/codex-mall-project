import { installClientHead } from "../install-client-head.js";
import { defineNuxtPlugin } from "#app/nuxt";
import { createHead } from "@unhead/vue/client";
import { createStreamableHead } from "@unhead/vue/stream/client";
import unheadOptions from "#build/unhead-options.mjs";
//#region src/head/runtime/plugins/unhead-stream.client.ts
const plugin = defineNuxtPlugin({
	name: "nuxt:head",
	enforce: "pre",
	setup(nuxtApp) {
		installClientHead(nuxtApp, createStreamableHead(unheadOptions) || createHead(unheadOptions));
	}
});
//#endregion
export { plugin as default };

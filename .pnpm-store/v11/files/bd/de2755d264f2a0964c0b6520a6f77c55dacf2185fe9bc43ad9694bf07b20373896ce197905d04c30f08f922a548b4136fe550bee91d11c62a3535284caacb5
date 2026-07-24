import { useRoute as useRoute$1 } from "../composables/router.js";
import { createError } from "../composables/error.js";
import { renderDiagnostics } from "../diagnostics/render.js";
import { computed, createVNode, defineComponent, onErrorCaptured, provide } from "vue";
import { viewDepthKey } from "vue-router";
import { islandComponents, pageIslandRoutes } from "#build/components.islands.mjs";
//#region src/app/components/island-renderer.ts
const PAGE_ISLAND_PREFIX = "page_";
const IslandRenderer = defineComponent({
	name: "IslandRenderer",
	props: { context: {
		type: Object,
		required: true
	} },
	setup(props) {
		const name = props.context.name;
		const component = Object.hasOwn(islandComponents, name) ? islandComponents[name] : void 0;
		if (!component) throw createError({
			status: 404,
			statusText: `Island component not found: ${props.context.name}`
		});
		if (props.context.name.startsWith(PAGE_ISLAND_PREFIX)) {
			const expectedIslandKey = pageIslandRoutes[props.context.name];
			const route = useRoute$1();
			provide(viewDepthKey, computed(() => {
				const depth = route.matched.findIndex((m) => (m.components?.default)?.__nuxt_island === expectedIslandKey);
				return depth === -1 ? 0 : depth + 1;
			}));
		}
		onErrorCaptured((e) => {
			renderDiagnostics.NUXT_E4015({
				name,
				cause: e
			});
		});
		return () => createVNode(component || "span", {
			...props.context.props,
			"data-island-uid": ""
		});
	}
});
//#endregion
export { IslandRenderer as default };

import { PageRouteSymbol } from "./injections.js";
import { renderDiagnostics } from "../diagnostics/render.js";
import { defineComponent, h, nextTick, onMounted, provide, shallowReactive } from "vue";
//#region src/app/components/route-provider.ts
const defineRouteProvider = (name = "RouteProvider") => defineComponent({
	name,
	props: {
		route: {
			type: Object,
			required: true
		},
		vnode: Object,
		vnodeRef: Object,
		renderKey: String,
		trackRootNodes: Boolean
	},
	setup(props) {
		const previousKey = props.renderKey;
		const previousRoute = props.route;
		const route = {};
		for (const key in props.route) Object.defineProperty(route, key, {
			get: () => previousKey === props.renderKey ? props.route[key] : previousRoute[key],
			enumerable: true
		});
		provide(PageRouteSymbol, shallowReactive(route));
		let vnode;
		if (import.meta.dev && import.meta.client && props.trackRootNodes) onMounted(() => {
			nextTick(() => {
				if (["#comment", "#text"].includes(vnode?.el?.nodeName)) {
					const filename = (vnode?.type)?.__file;
					renderDiagnostics.NUXT_E4004({ filename });
				}
			});
		});
		return () => {
			if (!props.vnode) return props.vnode;
			if (import.meta.dev && import.meta.client) {
				vnode = h(props.vnode, { ref: props.vnodeRef });
				return vnode;
			}
			return h(props.vnode, { ref: props.vnodeRef });
		};
	}
});
const RouteProvider = defineRouteProvider();
//#endregion
export { RouteProvider, defineRouteProvider };

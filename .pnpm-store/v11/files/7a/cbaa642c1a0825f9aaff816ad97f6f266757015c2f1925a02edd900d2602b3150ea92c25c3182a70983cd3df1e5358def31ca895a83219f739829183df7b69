import { DefineSetupFnComponent, Ref, VNode } from "vue";
import { RouteLocationNormalizedLoaded } from "vue-router";

//#region src/app/components/route-provider.d.ts
interface RouteProviderProps {
  route: RouteLocationNormalizedLoaded;
  vnode?: VNode;
  vnodeRef?: Ref<any>;
  renderKey?: string;
  trackRootNodes?: boolean;
}
type RouteProviderComponent = DefineSetupFnComponent<RouteProviderProps>;
declare const defineRouteProvider: (name?: string) => RouteProviderComponent;
declare const RouteProvider: RouteProviderComponent;
//#endregion
export { RouteProvider, RouteProviderComponent, defineRouteProvider };
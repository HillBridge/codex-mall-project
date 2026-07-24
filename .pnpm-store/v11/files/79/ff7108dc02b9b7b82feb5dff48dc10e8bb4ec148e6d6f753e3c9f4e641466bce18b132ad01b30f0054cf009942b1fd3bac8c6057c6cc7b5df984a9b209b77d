import { VNode } from "vue";
import { RouteLocationNormalizedLoaded, RouterView } from "vue-router";

//#region src/pages/runtime/utils.d.ts
type InstanceOf<T> = T extends (new (...args: any[]) => infer R) ? R : never;
type RouterViewSlot = Exclude<InstanceOf<typeof RouterView>['$slots']['default'], undefined>;
type RouterViewSlotProps = Parameters<RouterViewSlot>[0];
type SerializablePrimitive = string | number | boolean | null | undefined;
type MaybeArray<T> = T | T[];
/** JSON-serializable value (non-recursive definition to avoid excessive type depth) */
type SerializableValue = MaybeArray<SerializablePrimitive | Record<string, SerializablePrimitive>>;
/** Constrains T to only contain serializable properties. Non-serializable properties become `never`. */
type MakeSerializableObject<T> = T extends Function | symbol ? never : { [K in keyof T]: T[K] extends SerializableValue ? T[K] : never };
declare const generateRouteKey: (routeProps: RouterViewSlotProps, override?: string | ((route: RouteLocationNormalizedLoaded) => string)) => string | false | undefined;
declare const wrapInKeepAlive: (props: any, children: any) => {
  default: () => VNode;
};
/** @since 3.9.0 */
declare function toArray<T>(value: T | T[]): T[];
//#endregion
export { MakeSerializableObject, MaybeArray, RouterViewSlotProps, SerializableValue, generateRouteKey, toArray, wrapInKeepAlive };
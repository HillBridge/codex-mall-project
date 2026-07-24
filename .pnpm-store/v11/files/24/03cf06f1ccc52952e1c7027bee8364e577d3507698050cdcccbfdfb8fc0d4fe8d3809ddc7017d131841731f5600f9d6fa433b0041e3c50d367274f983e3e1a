import { NuxtLinkOptions } from "../types.js";
import { NuxtApp } from "../nuxt.js";
import { AllowedComponentProps, AnchorHTMLAttributes, DefineSetupFnComponent, SlotsType, UnwrapRef, VNode, VNodeProps } from "vue";
import { RouteLocation, RouteLocationRaw, RouterLinkProps, UseLinkReturn } from "vue-router";

//#region src/app/components/nuxt-link.d.ts
/**
 * `<NuxtLink>` is a drop-in replacement for both Vue Router's `<RouterLink>` component and HTML's `<a>` tag.
 * @see https://nuxt.com/docs/4.x/api/components/nuxt-link
 */
interface NuxtLinkProps<CustomProp extends boolean = false> extends Omit<RouterLinkProps, 'to'> {
  custom?: CustomProp;
  /**
   * Route Location the link should navigate to when clicked on.
   */
  to?: RouteLocationRaw;
  /**
   * An alias for `to`. If used with `to`, `href` will be ignored
   */
  href?: NuxtLinkProps['to'];
  /**
   * Forces the link to be considered as external (true) or internal (false). This is helpful to handle edge-cases
   */
  external?: boolean;
  /**
   * Where to display the linked URL, as the name for a browsing context.
   */
  target?: '_blank' | '_parent' | '_self' | '_top' | (string & {}) | null;
  /**
   * A rel attribute value to apply on the link. Defaults to "noopener noreferrer" for external links.
   */
  rel?: 'noopener' | 'noreferrer' | 'nofollow' | 'sponsored' | 'ugc' | (string & {}) | null;
  /**
   * If set to true, no rel attribute will be added to the link
   */
  noRel?: boolean;
  /**
   * A class to apply to links that have been prefetched.
   */
  prefetchedClass?: string;
  /**
   * When enabled will prefetch middleware, layouts and payloads of links in the viewport.
   */
  prefetch?: boolean;
  /**
   * Allows controlling when to prefetch links. By default, prefetch is triggered only on visibility.
   */
  prefetchOn?: 'visibility' | 'interaction' | Partial<{
    visibility: boolean;
    interaction: boolean;
  }>;
  /**
   * Escape hatch to disable `prefetch` attribute.
   */
  noPrefetch?: boolean;
  /**
   * An option to either add or remove trailing slashes in the `href` for this specific link.
   * Overrides the global `trailingSlash` option if provided.
   */
  trailingSlash?: 'append' | 'remove';
}
type NuxtLinkDefaultSlotProps<CustomProp extends boolean = false> = CustomProp extends true ? {
  href: string | null;
  navigate: (e?: MouseEvent) => Promise<void>;
  prefetch: (nuxtApp?: NuxtApp) => Promise<void>;
  prefetched: boolean;
  shouldPrefetch: (mode: 'visibility' | 'interaction') => boolean;
  route: (RouteLocation & {
    href: string;
  }) | undefined;
  rel: string | null;
  target: '_blank' | '_parent' | '_self' | '_top' | (string & {}) | null;
  isExternal: boolean;
  isActive: boolean;
  isExactActive: boolean;
} : UnwrapRef<UseLinkReturn>;
type NuxtLinkSlots<CustomProp extends boolean = false> = {
  default?: (props: NuxtLinkDefaultSlotProps<CustomProp>) => VNode[];
};
type NuxtLinkComponentProps<CustomProp extends boolean = false> = NuxtLinkProps<CustomProp> & VNodeProps & AllowedComponentProps & Omit<AnchorHTMLAttributes, keyof NuxtLinkProps<CustomProp>>;
type NuxtLinkComponentInstance<CustomProp extends boolean = false> = InstanceType<DefineSetupFnComponent<NuxtLinkComponentProps<CustomProp>, [], SlotsType<NuxtLinkSlots<CustomProp>>>>;
type NuxtLinkComponent = {
  new (props: NuxtLinkComponentProps<true> & {
    custom: true;
  }): NuxtLinkComponentInstance<true>;
  new (props: NuxtLinkComponentProps<false>): NuxtLinkComponentInstance<false>;
  new <CustomProp extends boolean = false>(props: NuxtLinkComponentProps<CustomProp>): NuxtLinkComponentInstance<CustomProp>;
};
declare function defineNuxtLink(options: NuxtLinkOptions): NuxtLinkComponent & Record<string, any>;
declare const NuxtLink: NuxtLinkComponent & Record<string, any>;
//#endregion
export { NuxtLinkComponent, type NuxtLinkOptions, NuxtLinkProps, NuxtLink as default, defineNuxtLink };
import { createHead as createHead$1 } from 'unhead/server';
export { prepareTemplate, propsToString, renderSSRHead, transformHtmlTemplate } from 'unhead/server';
import { v as vueInstall } from './shared/vue.DKb5ZKVl.mjs';
import { V as VueResolver } from './shared/vue.D2XR8FqS.mjs';
export { V as VueHeadMixin } from './shared/vue.B-M09k1-.mjs';
import 'vue';
import './shared/vue.6FLi74du.mjs';
import 'unhead/plugins';
import 'unhead/utils';

// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  const head = createHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  head.install = vueInstall(head);
  return head;
}

export { createHead };

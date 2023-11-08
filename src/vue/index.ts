export * from '@vue/reactivity'

export {
  nextTick,
  watch,
  inject,
  hasInjectionContext,
  getCurrentInstance,
  version
} from '@vue/runtime-core'

export type {
  WatchOptions,
  InjectionKey,
  ComponentPublicInstance,
  Plugin,
  App
} from '@vue/runtime-core'

// export * from '@vue/runtime-core'

export const isVue2 = false

export function set (obj: any, k: any, v: any) { obj[k] = v }
export function del (obj: any, k: any) { delete obj[k] }

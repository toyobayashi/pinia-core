export * from '@vue/reactivity'

export {
  nextTick,
  watch,
  WatchOptions
} from './runtime-core/index'

export const isVue2 = false

export type App = any
export type Plugin = any

export function set (obj: any, k: any, v: any) { obj[k] = v }
export function del (obj: any, k: any) { delete obj[k] }
export type ComponentPublicInstance = any

export function inject(k: any, r?: any): any {}
export function hasInjectionContext() { return false }
export type InjectionKey<T> = any

export function getCurrentInstance() { return null }

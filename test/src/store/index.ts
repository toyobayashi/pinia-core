import { useRef, useCallback, useSyncExternalStore } from 'react'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import type { Plugin, InjectionKey, App } from '@vue/runtime-core'
import { Store, createPinia, defineStore } from '../../..'

export function useStore<S extends Store, T = S> (piniaStore: S, selector?: (state: S['$state']) => T): T {
  const snap = useRef(null as unknown as { currentSelector: unknown; result: unknown })
  if (!snap.current) {
    snap.current = {
      currentSelector: selector,
      result: selector ? selector(piniaStore.$state) : piniaStore
    }
  } else {
    if (!Object.is(selector, snap.current.currentSelector)) {
      snap.current.currentSelector = selector
      snap.current.result = selector ? selector(piniaStore.$state) : new Proxy(piniaStore, {}) as typeof piniaStore
    }
  }

  const sub = useCallback((onUpdate: () => void) => {
    return mainStore.$subscribe((_, state) => {
      if (typeof selector === 'function') {
        const mayBeNew = selector(state)
        if (!Object.is(mayBeNew, snap.current.result)) {
          snap.current.result = mayBeNew
          onUpdate()
        }
      } else {
        snap.current.result = new Proxy(piniaStore, {}) as typeof piniaStore
        onUpdate()
      }
    })
  }, [piniaStore, selector])

  const getSnap = useCallback(() => snap.current.result as T, [])

  return useSyncExternalStore(sub, getSnap)
}

interface FakeApp {
  config: {
    globalProperties: Record<string, unknown>
  };
  use<Options extends unknown[]>(plugin: Plugin<Options>): this;
  provide<T>(key: InjectionKey<T> | string, value: T): this;
}

// for plugin
const fakeVueApp: FakeApp = {
  provide () {
    return this
  },
  config: {
    globalProperties: {}
  },
  use (plugin) {
    if (typeof plugin === 'function') {
      plugin(this as App)
    } else {
      plugin.install(this as App)
    }
    return this
  }
}

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
fakeVueApp.use(pinia)

declare module '../../..' {
  interface DefineStoreOptions<Id extends string, S extends StateTree, G, A> extends DefineStoreOptionsBase<S, Store<Id, S, G, A>> {
    persist: boolean
  }
}

const composeMainStore = defineStore('main_store', {
  persist: true,
  state: () => {
    return {
      count: 0
    }
  },
  actions: {
    addCount () {
      this.count++
    }
  }
})

const mainStore = composeMainStore(pinia)

export { mainStore }

import { useRef, useCallback, useSyncExternalStore } from 'react'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
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

  return useSyncExternalStore(sub, () => snap.current.result as T)
}

// for plugin
const fakeVueApp = {
  provide () {
    console.log('provide')
  },
  config: {
    globalProperties: {}
  },
  use (plugin: { install: (app: unknown) => void }) {
    return plugin.install(fakeVueApp)
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

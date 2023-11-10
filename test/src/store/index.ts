import { useRef, useCallback, useSyncExternalStore } from 'react'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import type { Plugin, InjectionKey, App } from '@vue/runtime-core'
import { Store, createPinia, defineStore } from '../../..'
import type { PiniaPlugin } from '../../..'

class SnapshotSaver<S extends object> {
  private _store: S
  private _selector?: (store: S) => unknown
  public getSnapshot: () => unknown
  public updateSnapshot: () => void

  public constructor (store: S, selector?: (store: S) => unknown) {
    this._store = store
    this._selector = selector

    let snapshot: unknown
    this.getSnapshot = () => snapshot
    this.updateSnapshot = () => {
      const { _store, _selector } = this
      snapshot = _selector ? _selector(_store) : new Proxy(_store, {})
    }

    this.updateSnapshot()
  }

  public tryUpdate (store: S, selector: ((store: S) => unknown) | undefined) {
    const prevStore = this._store
    const prevSelector = this._selector
    const newStore = !Object.is(store, prevStore)
    const newSelector = !Object.is(selector, prevSelector)
    if (newStore) this._store = store
    if (newSelector) this._selector = selector
    if (newStore || newSelector) {
      this.updateSnapshot()
    }
  }
}

export function usePiniaStore<
  S extends { $subscribe: (cb: (...args: unknown[]) => unknown) => () => void },
  T = S
> (
  store: S,
  selector?: (store: S) => T
): T {
  const snap = useRef<SnapshotSaver<S>>(null!)
  if (!snap.current) {
    snap.current = new SnapshotSaver(store, selector)
  } else {
    snap.current.tryUpdate(store, selector)
  }

  const subscribe = useCallback((onStoreChange: () => void) => {
    return store.$subscribe(() => {
      snap.current.updateSnapshot()
      onStoreChange()
    })
  }, [store])

  return useSyncExternalStore(subscribe, snap.current.getSnapshot as () => T)
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
pinia.use(piniaPluginPersistedstate as unknown as PiniaPlugin)
fakeVueApp.use(pinia)

declare module '../../..' {
  interface DefineStoreOptions<
    Id extends string,
    S extends StateTree,
    G,
    A
  > extends DefineStoreOptionsBase<S, Store<Id, S, G, A>> {
    persist: boolean
  }
}

const mainStore = defineStore('main_store', {
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
})(pinia)

export { mainStore }

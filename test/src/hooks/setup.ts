/* eslint-disable @typescript-eslint/no-explicit-any */
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { effectScope, shallowReactive, readonly, watch, queuePostFlushCb, effect, nextTick } from '@vue/runtime-core'
import type { EffectScope, ShallowReactive } from '@vue/runtime-core'

export interface SetupContext {
  onBeforeMount: (hook: () => any) => void
  onMounted: (hook: () => any) => void
  onBeforeUpdate: (hook: () => any) => void
  onUpdated: (hook: () => any) => void
  onBeforeUnmount: (hook: () => any) => void
  onUnmounted: (hook: () => any) => void
}

export const enum LifecycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um'
}

export type SetupFunction<P extends object, R extends object | ((...args: any[]) => JSX.Element)> = (props: P, context: SetupContext) => R

export interface SetupComponentInstance<P extends object, R extends object | ((...args: any[]) => JSX.Element)> {
  setup: SetupFunction<P, R>
  scope: EffectScope
  props: ShallowReactive<P>
  setupResult: R
  f: () => void
  [LifecycleHooks.BEFORE_MOUNT]: (() => void)[]
  [LifecycleHooks.MOUNTED]: (() => void)[]
  [LifecycleHooks.BEFORE_UPDATE]: (() => void)[]
  [LifecycleHooks.UPDATED]: (() => void)[]
  [LifecycleHooks.BEFORE_UNMOUNT]: (() => void)[]
  [LifecycleHooks.UNMOUNTED]: (() => void)[]
}

function invokeLifecycle(target: SetupComponentInstance<any, any>, type: LifecycleHooks): void {
  const methods = target[type]
  if (!methods || methods.length === 0) return
  for (let i = 0; i < methods.length; ++i) {
    methods[i]()
  }
}

const injectHook = (target: SetupComponentInstance<any, any>, type: LifecycleHooks) => (hook: () => any) => {
  (target[type] = target[type] || []).push(() => {
    if (target.scope) {
      target.scope.run(hook)
    } else {
      hook()
    }
  })
}

function clearAllLifecycles (target: SetupComponentInstance<any, any>) {
  const lifecycles = [
    LifecycleHooks.BEFORE_MOUNT,
    LifecycleHooks.MOUNTED,
    LifecycleHooks.BEFORE_UPDATE,
    LifecycleHooks.UPDATED,
    LifecycleHooks.BEFORE_UNMOUNT,
    LifecycleHooks.UNMOUNTED
  ]
  for (let i = 0; i < lifecycles.length; ++i) {
    target[lifecycles[i]].length = 0
  }
}

function initInstance<P extends object, R extends object | ((...args: any[]) => JSX.Element)> (
  instance: MutableRefObject<SetupComponentInstance<P, R>>,
  setupFunction?: SetupFunction<P,R>,
  update?: (v: any) => void,
  props?: P
) {
  const scope = effectScope()
  if (update) {
    instance.current.f = () => { update(Object.create(null)) }
  }
  if (setupFunction) {
    instance.current.setup = setupFunction
  }
  instance.current.scope = scope
  if (props) {
    if (!instance.current.props) {
      instance.current.props = shallowReactive({ ...props })
    } else {
      updateReactiveProps(instance, props)
    }
  }
  instance.current[LifecycleHooks.BEFORE_MOUNT] = []
  instance.current[LifecycleHooks.MOUNTED] = []
  instance.current[LifecycleHooks.BEFORE_UPDATE] = []
  instance.current[LifecycleHooks.UPDATED] = []
  instance.current[LifecycleHooks.BEFORE_UNMOUNT] = []
  instance.current[LifecycleHooks.UNMOUNTED] = []

  const context: SetupContext = {
    onBeforeMount: injectHook(instance.current, LifecycleHooks.BEFORE_MOUNT),
    onMounted: injectHook(instance.current, LifecycleHooks.MOUNTED),
    onBeforeUpdate: injectHook(instance.current, LifecycleHooks.BEFORE_UPDATE),
    onUpdated: injectHook(instance.current, LifecycleHooks.UPDATED),
    onBeforeUnmount: injectHook(instance.current, LifecycleHooks.BEFORE_UNMOUNT),
    onUnmounted: injectHook(instance.current, LifecycleHooks.UNMOUNTED)
  }

  const updateCallback = () => {
    invokeLifecycle(instance.current, LifecycleHooks.BEFORE_UPDATE)
    instance.current.f()
    nextTick().then(() => {
      invokeLifecycle(instance.current, LifecycleHooks.UPDATED)
    })
  }

  const setupResult = scope.run(() => {
    return instance.current.setup(readonly(instance.current.props) as P, context)
  })

  if (typeof setupResult === 'function') {
    let args: any[]
    // eslint-disable-next-line prefer-spread
    const render = effect(() => (setupResult as (...args: any[]) => any).apply(null, args), {
      lazy: true,
      scope,
      scheduler: () => { queuePostFlushCb(updateCallback) }
    })
    instance.current.setupResult = function (this: any) {
      // eslint-disable-next-line prefer-rest-params
      args = Array.prototype.slice.call(arguments)
      const r = render()
      args = undefined!
      return r
    } as R
  } else {
    scope.run(() => {
      watch(() => setupResult, () => {
        queuePostFlushCb(updateCallback)
      }, { deep: true, immediate: false })
    })
    instance.current.setupResult = setupResult as R
  }

  queuePostFlushCb(() => {
    instance.current.f()
  })
}

function updateReactiveProps<P extends object> (instance: MutableRefObject<SetupComponentInstance<P, any>>, props: P) {
  const keys = Object.keys(props) as Array<keyof typeof props>
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i]
    instance.current.props[key] = props[key]
  }
  const originalKeys = Object.keys(instance.current.props)
  for (let i = 0; i < originalKeys.length; ++i) {
    const k = originalKeys[i] as keyof typeof props
    if (keys.indexOf(k) === -1) {
      delete instance.current.props[k]
    }
  }
}

export function useSetup<P extends object, R extends object | ((...args: any[]) => JSX.Element)>(
  setupFunction: SetupFunction<P, R>,
  props: P
) {
  const update = useState()[1]
  const instance = useRef<SetupComponentInstance<P, R>>(null!)

  if (!instance.current) {
    instance.current = {} as unknown as SetupComponentInstance<P, R>
    initInstance(instance, setupFunction, update, props)
    invokeLifecycle(instance.current, LifecycleHooks.BEFORE_MOUNT)
  } else {
    if (!Object.is(instance.current.setup, setupFunction)) {
      instance.current.scope.stop()
      initInstance(instance, setupFunction, update, props)
    } else {
      updateReactiveProps(instance, props)
    }
  }

  useEffect(() => {
    if (!instance.current.scope) {
      initInstance(instance)
    }
    invokeLifecycle(instance.current, LifecycleHooks.MOUNTED)
    return () => {
      invokeLifecycle(instance.current, LifecycleHooks.BEFORE_UNMOUNT)
      instance.current.scope.stop()
      instance.current.scope = null!
      invokeLifecycle(instance.current, LifecycleHooks.UNMOUNTED)
      clearAllLifecycles(instance.current)
    }
  }, [])

  return instance.current.setupResult
}

export function defineComponent<P extends object, R extends React.FC<P>>(setup: SetupFunction<P, R>) {
  return function (props: P, ref: any) {
    return useSetup(setup, props)(props, ref)
  }
}

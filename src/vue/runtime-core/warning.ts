export function pushWarningContext(vnode: any) {}

export function popWarningContext() {}

export const warn = __DEV__ ? console.warn : () => {}

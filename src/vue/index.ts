export * from '@vue/runtime-core'

const isVue2 = false

/*#__NO_SIDE_EFFECTS__*/
function set (obj: any, k: any, v: any) { obj[k] = v }

/*#__NO_SIDE_EFFECTS__*/
function del (obj: any, k: any) { delete obj[k] }

export { isVue2, set, del }

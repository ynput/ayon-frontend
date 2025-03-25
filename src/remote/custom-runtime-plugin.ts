import type { FederationRuntimePlugin } from '@module-federation/enhanced/runtime'

// @ts-ignore
const runtimePlugin: () => FederationRuntimePlugin = function () {
  return {
    name: 'my-runtime-plugin',
    errorLoadRemote: (error) => {
      // console.log('errorLoadRemote:', error)
    },
    loadEntry: (entry) => {
      // console.log('loadEntry:', entry)
    },
    // beforeInit(args) {
    //   console.log('beforeInit: ', args)
    //   return args
    // },
    // beforeRequest(args) {
    //   console.log('beforeRequest: ', args)
    //   return args
    // },
    // afterResolve(args) {
    //   console.log('afterResolve', args)
    //   return args
    // },
    // onLoad(args) {
    //   console.log('onLoad: ', args)
    //   return args
    // },
    // async loadShare(args) {
    //   //   console.log('loadShare:', args)
    // },
    // async beforeLoadShare(args) {
    //   //   console.log('beforeloadShare:', args)
    //   return args
    // },
  }
}
export default runtimePlugin

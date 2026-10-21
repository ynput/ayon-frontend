import { combineSlices, configureStore, createDynamicMiddleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from './client'

// The one root reducer and middleware slot of the host store. Addons get these modules from the
// host through module federation, so a slice or middleware they add lands in the host store.
// See src/remote/AGENTS.md in ayon-frontend.

// Addons inject their slices with `mySlice.injectInto(rootReducer)` or `rootReducer.inject(...)`
export const rootReducer = combineSlices(api)

// Addons add middleware with `addMiddleware(...)`
export const dynamicMiddleware = createDynamicMiddleware()
export const { addMiddleware, withMiddleware } = dynamicMiddleware

// For running an addon on its own (its dev server), where there is no host store.
// Inside the host, addons use the host store and must not create one.
export const createStandaloneStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware, dynamicMiddleware.middleware),
  })
  setupListeners(store.dispatch)
  return store
}

// Redux Toolkit
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

// Reducers
import userReducer from '@state/user'
import contextReducer, { contextLocalItems } from '@state/context'
import projectReducer from '@state/project'
import dashboardReducer, { dashboardLocalItems } from '@state/dashboard'
import addonsManagerReducer from '@state/addonsManager'
import viewerReducer, { viewerSearchParams } from '@state/viewer'
import releaseInstallerReducer, { releaseInstallerLocalItems } from '@state/releaseInstaller'
import progressReducer from '@state/progress'

// API
import { api, dynamicMiddleware, rootReducer } from '@shared/api'

// Middleware
import localStorageMiddleware from './middleware/localStorageMiddleware'
import searchParamsMiddleware from './middleware/searchParamsMiddleware'

// The root reducer comes from shared so addons can inject their own slices into this store.
// overrideExisting keeps hot reloaded reducers working, the root reducer outlives this module.
const injectOptions = { overrideExisting: true }
const reducer = rootReducer
  .inject({ reducerPath: 'user', reducer: userReducer }, injectOptions)
  .inject({ reducerPath: 'context', reducer: contextReducer }, injectOptions)
  .inject({ reducerPath: 'project', reducer: projectReducer }, injectOptions)
  .inject({ reducerPath: 'dashboard', reducer: dashboardReducer }, injectOptions)
  .inject({ reducerPath: 'addonsManager', reducer: addonsManagerReducer }, injectOptions)
  .inject({ reducerPath: 'viewer', reducer: viewerReducer }, injectOptions)
  .inject({ reducerPath: 'releaseInstaller', reducer: releaseInstallerReducer }, injectOptions)
  .inject({ reducerPath: 'progress', reducer: progressReducer }, injectOptions)

const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(api.middleware)
      // addons add their middleware here (addMiddleware from @shared/api)
      .concat(dynamicMiddleware.middleware)
      .concat(
        localStorageMiddleware({
          ...dashboardLocalItems,
          ...contextLocalItems,
          ...releaseInstallerLocalItems,
        }),
      )
      .concat(searchParamsMiddleware({ ...viewerSearchParams })),
})
setupListeners(store.dispatch)

export default store

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {psts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

import { useDispatch, useSelector } from 'react-redux'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

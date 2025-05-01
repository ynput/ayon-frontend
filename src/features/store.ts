// Redux Toolkit
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

// Reducers
import userReducer from '@state/user'
import contextReducer, { contextLocalItems } from '@state/context'
import projectReducer from '@state/project'
import dashboardReducer, { dashboardLocalItems } from '@state/dashboard'
import detailsReducer, { detailsLocalItems } from '@state/details'
import addonsManagerReducer from '@state/addonsManager'
import viewerReducer, { viewerSearchParams } from '@state/viewer'
import releaseInstallerReducer, { releaseInstallerLocalItems } from '@state/releaseInstaller'
import progressReducer from '@state/progress'

// API
import { BaseAPI } from '@shared/client'

// Middleware
import localStorageMiddleware from './middleware/localStorageMiddleware'
import searchParamsMiddleware, { updateUrlOnUriChange } from './middleware/searchParamsMiddleware'

const store = configureStore({
  reducer: {
    user: userReducer,
    context: contextReducer,
    project: projectReducer,
    dashboard: dashboardReducer,
    details: detailsReducer,
    addonsManager: addonsManagerReducer,
    viewer: viewerReducer,
    releaseInstaller: releaseInstallerReducer,
    progress: progressReducer,
    [BaseAPI.reducerPath]: BaseAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(BaseAPI.middleware)
      .concat(
        localStorageMiddleware({
          ...dashboardLocalItems,
          ...contextLocalItems,
          ...detailsLocalItems,
          ...releaseInstallerLocalItems,
        }),
      )
      .concat(searchParamsMiddleware({ ...viewerSearchParams }))
      .concat(updateUrlOnUriChange()),
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

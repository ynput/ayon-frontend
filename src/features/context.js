import { createSlice } from '@reduxjs/toolkit'
import getInitialStateLocalStorage from './middleware/getInitialStateLocalStorage'
import { cloneDeep, get, set } from 'lodash'

const initialState = {
  expandedFolders: {},
  expandedProducts: {},
  expandedRepresentations: {},
  filters: {
    browser: {
      productTaskTypes: [],
    },
  },
  focused: {
    type: null,
    subTypes: [],
    folders: [],
    products: [],
    versions: [],
    representations: [],
    tasks: [],
    tasksNames: [],
    workfiles: [],
    editor: [],
    lastFocused: null,
  },
  selectedVersions: {},
  pairing: [],
  reload: {},
  breadcrumbs: { scope: '' },
  share: { name: null, data: null, link: null, img: null },
  uri: null,
  uriChanged: 0,
  uploadProgress: 0, // percentage 0 - 100
  menuOpen: false,
  activeReactionPopup: null,
  previewFiles: [],
  previewFilesProjectName: '',
  previewFilesIndex: null,
  previewFilesActivityId: null,
}

// all the keys that are stored in local storage
// TODO: remove focus local keys marked with // as they are not used anymore
const localStorageKeys = [
  'expandedFolders',
  'expandedProducts',
  'expandedRepresentations',
  'filters.browser.productTaskTypes',
  'focused.type', //
  'focused.subTypes', //
  'focused.folders', //
  'focused.products', //
  'focused.versions', //
  'focused.representations', //
  'focused.tasks', //
  'focused.tasksNames', //
  'focused.workfiles', //
  'focused.editor', //
  'selectedVersions', //
]

const initialStateWithLocalStorage = cloneDeep(initialState)

// replace initialState key values with localStorageKeys
localStorageKeys.forEach((key) => {
  const localKey = 'context/' + key.replace(/\./g, '/')
  const initialValue = get(initialStateWithLocalStorage, key)
  const newValue = getInitialStateLocalStorage(localKey, initialValue)

  set(initialStateWithLocalStorage, key, newValue)
})

// each reducer defined how a specific key is updated, using the payload or a specific value
const reducers = {
  selectProject: {
    expandedFolders: {
      value: initialState.expandedFolders,
    },
    selectedVersions: {
      value: initialState.selectedVersions,
    },
    pairing: {
      value: initialState.pairing,
    },
    'focused.type': {
      value: initialState.focused.type,
    },
    'focused.subTypes': {
      value: initialState.focused.subTypes,
    },
    'focused.folders': {
      value: initialState.focused.folders,
    },
    'focused.products': {
      value: initialState.focused.products,
    },
    'focused.versions': {
      value: initialState.focused.versions,
    },
    'focused.representations': {
      value: initialState.focused.representations,
    },
    'focused.tasks': {
      value: initialState.focused.tasks,
    },
    'focused.tasksNames': {
      value: initialState.focused.tasksNames,
    },
    'focused.workfiles': {
      value: initialState.focused.workfiles,
    },
    'focused.editor': {
      value: initialState.focused.editor,
    },
  },
  setExpandedFolders: {
    expandedFolders: {
      payload: true,
    },
  },
  setExpandedProducts: {
    expandedProducts: {
      payload: true,
    },
  },
  setExpandedReps: {
    expandedRepresentations: {
      payload: true,
    },
  },
  setFocusedFolders: {
    'focused.type': {
      value: 'folder',
    },
    'focused.subTypes': {
      payload: 'subTypes',
    },
    'focused.folders': {
      payload: 'ids',
    },
    'focused.products': {
      value: [],
    },
    'focused.versions': {
      value: [],
    },
    'focused.representations': {
      value: [],
    },
    'focused.tasks': {
      value: [],
    },
    pairing: {
      value: [],
    },
  },
  setFocusedProducts: {
    'focused.type': {
      value: 'product',
    },
    'focused.subTypes': {
      payload: 'subTypes',
    },
    'focused.products': {
      payload: 'ids',
    },
    'focused.versions': {
      value: [],
    },
  },
  setFocusedTasks: {
    'focused.type': {
      value: 'task',
    },
    'focused.subTypes': {
      payload: 'subTypes',
    },
    'focused.tasks': {
      payload: 'ids',
    },
    'focused.tasksNames': {
      payload: 'names',
      initFallback: true,
    },
    'focused.versions': {
      value: [],
    },
  },
  setFocusedWorkfiles: {
    'focused.type': {
      value: 'workfile',
    },
    'focused.subTypes': {
      value: [],
    },
    'focused.workfiles': {
      payload: true,
    },
  },
  setFocusedRepresentations: {
    'focused.type': {
      value: 'representation',
    },
    'focused.subTypes': {
      value: [],
    },
    'focused.representations': {
      payload: true,
    },
  },
  editorSelectionChanged: {
    'focused.editor': {
      payload: 'selection',
    },
    'focused.folders': {
      payload: 'folders',
    },
    'focused.tasks': {
      payload: 'tasks',
    },
  },
  setFocusedVersions: {
    'focused.type': {
      value: 'version',
    },
    'focused.subTypes': {
      value: [],
    },
    'focused.versions': {
      payload: true,
    },
    'focused.tasks': {
      value: [],
    },
  },
  setFocusedType: {
    'focused.type': {
      payload: 'type',
    },
  },
  setSelectedVersions: {
    selectedVersions: {
      payload: true,
    },
  },
  clearFocus: {
    'focused.type': {
      value: null,
    },
    'focused.subTypes': {
      value: [],
    },
    'focused.folders': {
      value: [],
    },
    'focused.products': {
      value: [],
    },
    'focused.versions': {
      value: [],
    },
  },
  setPairing: {
    pairing: {
      payload: true,
    },
  },
  productSelected: {
    'focused.type': {
      value: 'version',
    },
    'focused.subTypes': {
      value: [],
    },
    'focused.versions': {
      payload: 'versions',
    },
    'focused.products': {
      payload: 'products',
    },
    'focused.representations': {
      value: [],
    },
  },
  setUri: {
    uri: {
      payload: true,
    },
  },
  onUriNavigate: {
    'focused.folders': {
      payload: 'folders',
    },
    'focused.tasks': {
      payload: 'tasks',
    },
    'focused.products': {
      payload: 'products',
    },
    'focused.versions': {
      payload: 'versions',
    },
    'focused.representations': {
      payload: 'representations',
    },
    'focused.workfiles': {
      payload: 'workfiles',
    },
    'focused.type': {
      payload: 'type',
    },
    'focused.subTypes': {
      value: [],
    },
  },
  updateBrowserFilters: {
    'filters.browser.productTaskTypes': {
      payload: 'productTaskTypes',
    },
  },
}

// we use this function to update the state with the reducer values
const updateStateWithReducer = (reducer, state, action) => {
  if (!reducer) return

  Object.keys(reducer).forEach((k) => {
    let newValue
    const { value, payload, initFallback } = reducer[k]
    // if value is set, use that
    if (value !== undefined) {
      newValue = value
    }
    // if payload is not a string, use the payload on the action
    else if (typeof payload !== 'string') {
      newValue = action.payload
    }
    // if payload is a string, use that as the key, split by '.'
    else {
      let payloadValue = get(action.payload, payload)

      newValue = payloadValue
    }

    if (newValue === undefined && initFallback) {
      newValue = get(initialStateWithLocalStorage, k)
    }

    if (newValue !== undefined) {
      set(state, k, newValue)
    }
  })
}

const contextSlice = createSlice({
  name: 'context',
  initialState: initialStateWithLocalStorage,
  reducers: {
    selectProject: (state) => {
      updateStateWithReducer(reducers.selectProject, state)
    },
    setExpandedFolders: (state, action) => {
      updateStateWithReducer(reducers.setExpandedFolders, state, action)
    },
    setExpandedProducts: (state, action) => {
      updateStateWithReducer(reducers.setExpandedProducts, state, action)
    },
    setExpandedReps: (state, action) => {
      updateStateWithReducer(reducers.setExpandedReps, state, action)
    },
    setFocusedFolders: (state, action) => {
      updateStateWithReducer(reducers.setFocusedFolders, state, action)
    },
    setFocusedProducts: (state, action) => {
      updateStateWithReducer(reducers.setFocusedProducts, state, action)
    },
    setFocusedTasks: (state, action) => {
      updateStateWithReducer(reducers.setFocusedTasks, state, action)
    },
    setFocusedWorkfiles: (state, action) => {
      updateStateWithReducer(reducers.setFocusedWorkfiles, state, action)
    },
    setFocusedRepresentations: (state, action) => {
      updateStateWithReducer(reducers.setFocusedRepresentations, state, action)
    },
    editorSelectionChanged: (state, action) => {
      updateStateWithReducer(reducers.editorSelectionChanged, state, action)
    },
    setFocusedVersions: (state, action) => {
      updateStateWithReducer(reducers.setFocusedVersions, state, action)
    },
    setFocusedType: (state, action) => {
      updateStateWithReducer(reducers.setFocusedType, state, action)
    },
    setSelectedVersions: (state, action) => {
      updateStateWithReducer(reducers.setSelectedVersions, state, action)
    },
    clearFocus: (state) => {
      updateStateWithReducer(reducers.clearFocus, state)
    },
    setPairing: (state, action) => {
      updateStateWithReducer(reducers.setPairing, state, action)
    },
    productSelected: (state, action) => {
      updateStateWithReducer(reducers.productSelected, state, action)
    },
    setUri: (state, action) => {
      updateStateWithReducer(reducers.setUri, state, action)
    },
    setUriChanged: (state) => {
      state.uriChanged = state.uriChanged + 1
    },
    onUriNavigate: (state, action) => {
      updateStateWithReducer(reducers.onUriNavigate, state, action)
    },
    updateBrowserFilters: (state, action) => {
      updateStateWithReducer(reducers.updateBrowserFilters, state, action)
    },
    onFocusChanged: (state, action) => {
      state.focused.lastFocused = action.payload
    },
    setReload: (state, action) => {
      state.reload = {
        ...state.reload,
        [action.payload.type]: action.payload.reload,
      }
    },
    onShare: (state, action) => {
      state.share.name = action.payload?.name
      state.share.data = action.payload?.data
      state.share.img = action.payload?.img
      state.share.link = action.payload?.link
    },
    closeShare: (state) => {
      state.share = {
        name: null,
        data: null,
        img: null,
        link: null,
      }
    },
    onUploadProgress: (
      state,
      {
        payload: {
          progress: { loaded, total },
          index,
          filesTotal,
        },
      },
    ) => {
      const percent = Math.round(((index - 1) * 100 + (loaded * 100) / total) / filesTotal)
      state.uploadProgress = percent
    },
    onUploadFinished: (state) => {
      state.uploadProgress = 0
    },
    setMenuOpen: (state, action) => {
      state.menuOpen = action.payload
    },
    toggleMenuOpen: (state, action) => {
      // no payload means toggle off
      if (!action.payload) action.payload = false
      // if payload is same as current state, toggle off
      else if (action.payload === state.menuOpen) state.menuOpen = false
      // else set payload
      else state.menuOpen = action.payload
    },
    onCommentImageOpen: (state, action) => {
      // set the preview file
      state.previewFiles = action.payload.files
      state.previewFilesProjectName = action.payload.projectName
      state.previewFilesActivityId = action.payload.activityId
      state.previewFilesIndex = action.payload.index
    },
    onCommentImageActivityAndIndexChange: (state, action) => {
      state.previewFilesActivityId = action.payload.activityId
      state.previewFilesIndex = action.payload.index
    },
    onCommentImageIndexChange: (state, action) => {
      state.previewFilesIndex += action.payload.delta
    },
    onFilePreviewClose: (state) => {
      // clear the preview file
      state.previewFiles = initialState.previewFiles
      state.previewFilesProjectName = initialState.previewFilesProjectName
      state.previewFilesActivityId = null
      state.previewFilesIndex = null
    },
  }, // reducers
})

export const {
  setFocusedFolders,
  setFocusedProducts,
  setFocusedVersions,
  setFocusedTasks,
  setFocusedWorkfiles,
  setFocusedRepresentations,
  setSelectedVersions,
  setExpandedFolders,
  setExpandedReps,
  setExpandedProducts,
  setPairing,
  setReload,
  setFocusedType,
  setUri,
  setUriChanged,
  productSelected,
  editorSelectionChanged,
  projectSelected,
  onShare,
  closeShare,
  selectProject,
  onFocusChanged,
  onUploadProgress,
  onUploadFinished,
  setMenuOpen,
  toggleMenuOpen,
  onUriNavigate,
  updateBrowserFilters,
  onCommentImageOpen,
  onCommentImageIndexChange,
  onCommentImageActivityAndIndexChange,
  onFilePreviewClose,
} = contextSlice.actions

export default contextSlice.reducer

// topics that need to set localStorage. If there is no explicit value, it will be the payload value
const contextLocalItems = {}

// for each reducer we check if we need to set localStorage middleware and what values to set
Object.entries(reducers).forEach(([reducerKey, reducerStates]) => {
  const statePathKeys = Object.keys(reducerStates)
  if (statePathKeys.length === 0) return

  const localStates = []

  // check if path is in local storage keys
  statePathKeys.forEach((key) => {
    if (localStorageKeys.includes(key)) localStates.push(key)
  })

  // no local states, return
  if (localStates.length === 0) return // this reducer does not affect local storage

  // create the middleware object to update local storage
  const middleware = {
    ['context/' + reducerKey]: localStates.map((key) => {
      const value = reducerStates[key].value
      const payload = reducerStates[key].payload
      const initialValue = get(initialState, key)

      const stateObj = {
        key: `context/${key.replace(/\./g, '/')}`,
        initialValue,
      }
      if (value !== undefined) stateObj.value = value
      else if (typeof payload === 'string') stateObj.payload = payload

      return stateObj
    }),
  }

  // add the middleware to the local storage items
  Object.assign(contextLocalItems, middleware)
})

export { contextLocalItems }

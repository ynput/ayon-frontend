import { createSlice } from '@reduxjs/toolkit'
import getInitialStateLocalStorage from './middleware/getInitialStateLocalStorage'

const initialState = {
  expandedFolders: {},
  focused: {
    type: null,
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
  uri: getInitialStateLocalStorage('uri', null),
  uriChanged: 0,
  uploadProgress: 0, // percentage 0 - 100
  menuOpen: false,
}

const contextSlice = createSlice({
  name: 'context',
  initialState,
  reducers: {
    selectProject: (state) => {
      // reset expandedFolders, focused, selectedVersions, pairing
      state.expandedFolders = initialState.expandedFolders
      state.focused = initialState.focused
      state.selectedVersions = initialState.selectedVersions
      state.pairing = initialState.pairing
    },

    setExpandedFolders: (state, action) => {
      state.expandedFolders = action.payload
    },

    setFocusedFolders: (state, action) => {
      state.focused.type = 'folder'
      state.focused.folders = action.payload
      state.focused.products = []
      state.focused.versions = []
      state.pairing = []
    },

    setFocusedProducts: (state, action) => {
      state.focused.type = 'product'
      state.focused.products = action.payload
      state.focused.versions = []
    },

    setFocusedTasks: (state, action) => {
      state.focused.type = 'task'
      state.focused.tasks = action.payload.ids || []
      if ('names' in action.payload) state.focused.tasksNames = action.payload.names || []
      state.focused.versions = []
    },

    setFocusedWorkfiles: (state, action) => {
      state.focused.type = 'workfile'
      state.focused.workfiles = action.payload
    },

    setFocusedRepresentations: (state, action) => {
      state.focused.type = 'representation'
      state.focused.representations = action.payload
    },

    editorSelectionChanged: (state, action) => {
      // updates focused.editor, focused.folders, focused.tasks
      if (action.payload.tasks) state.focused.tasks = action.payload.tasks
      if (action.payload.folders) state.focused.folders = action.payload.folders
      // // take both above and add to focused.editor
      state.focused.editor = action.payload.selection
    },
    setFocusedVersions: (state, action) => {
      if (action.payload === null) {
        state.focused.type = 'folder'
        state.focused.versions = []
      } else {
        state.focused.type = 'version'
        state.focused.versions = action.payload
        state.focused.tasks = []
      }
    },
    setFocusedType: (state, action) => {
      state.focused.type = action.payload
    },

    setSelectedVersions: (state, action) => {
      state.selectedVersions = action.payload
    },

    //eslint-disable-next-line no-unused-vars
    clearFocus: (state, action) => {
      state.focused.type = null
      state.focused.folders = []
      state.focused.products = []
      state.focused.versions = []
    },

    setPairing: (state, action) => {
      state.pairing = action.payload
    },
    productSelected: (state, action) => {
      state.focused.type = 'version'

      state.focused.versions = action.payload.versions
      state.focused.products = action.payload.products
    },

    setUri: (state, action) => {
      //console.log('setUri', action.payload)
      state.uri = action.payload
    },

    // eslint-disable-next-line no-unused-vars
    setUriChanged: (state, action) => {
      state.uriChanged = state.uriChanged + 1
    },
    onUriNavigate: (state, action) => {
      // focus folders
      state.focused.folders = action.payload.folders
      // focus tasks
      state.focused.tasks = action.payload.tasks
      // focus products
      state.focused.products = action.payload.products
      // focus versions
      state.focused.versions = action.payload.versions
      // focus representations
      state.focused.representations = action.payload.representations
      // focus workfiles
      state.focused.workfiles = action.payload.workfiles
      // finally set focused type
      state.focused.type = action.payload.type
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
} = contextSlice.actions

export default contextSlice.reducer

// topics that need to set localStorage. If there is no explicit value, it will be the payload value
export const contextLocalItems = {
  'context/setUri': [{ key: 'uri' }],
}

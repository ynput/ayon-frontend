import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  expandedFolders: {},
  focused: {
    type: null,
    folders: [],
    products: [],
    versions: [],
    representations: [],
    tasks: [],
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
  projectMenuOpen: false,
  userMenuOpen: false,
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
      state.focused.tasks = action.payload
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
    setProjectMenuOpen: (state, action) => {
      state.projectMenuOpen = action.payload
    },
    setUserMenuOpen: (state, action) => {
      state.userMenuOpen = action.payload
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
  setProjectMenuOpen,
  setUserMenuOpen,
} = contextSlice.actions

export default contextSlice.reducer

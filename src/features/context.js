import { createSlice } from '@reduxjs/toolkit'

const contextSlice = createSlice({
  name: 'context',
  initialState: {
    projectName: null,
    project: {},
    expandedFolders: {},
    focusedType: null,
    focusedFolders: [],
    focusedSubsets: [],
    focusedVersions: [],
    focusedTasks: [],
    selectedVersions: {},
    pairing: [],
    dialog: {},
    reload: {},
  },
  reducers: {
    selectProject: (state, action) => {
      window.localStorage.setItem('currentProject', action.name)
      state.projectName = action.payload
      return state
    },

    setProjectData: (state, action) => {
      state.project = action.payload
      return state
    },

    setExpandedFolders: (state, action) => {
      state.expandedFolders = action.payload
    },

    setFocusedFolders: (state, action) => {
      state.focusedType = 'folder'
      state.focusedFolders = action.payload
      state.focusedSubsets = []
      state.focusedVersions = []
      state.pairing = []
    },

    setFocusedSubsets: (state, action) => {
      state.focusedType = 'subset'
      state.focusedSubsets = action.payload
      state.focusedVersions = []
    },

    setFocusedTasks: (state, action) => {
      state.focusedType = 'task'
      state.focusedTasks = action.payload
      state.focusedVersions = []
    },

    setFocusedVersions: (state, action) => {
      if (action.payload === null) {
        state.focusedType = 'folder'
        state.focusedVersions = []
      } else {
        state.focusedType = 'version'
        state.focusedVersions = action.payload
        state.focusedTasks = []
      }
    },

    setSelectedVersions: (state, action) => {
      state.selectedVersions = action.payload
    },

    clearFocus: (state, action) => {
      state.focusedType = null
      state.focusedFolders = []
      state.focusedSubsets = []
      state.focusedVersions = []
    },

    setPairing: (state, action) => {
      state.pairing = action.payload
    },

    setBreadcrumbs: (state, action) => {
      let bc = state.breadcrumbs || {}
      if (action.payload.parents) {
        bc.parents = action.payload.parents
        bc.folder = null
        bc.subset = null
        bc.version = null
        bc.representation = null
      }
      if (action.payload.folder) {
        bc.folder = action.payload.folder
        bc.subset = null
        bc.version = null
        bc.representation = null
      }
      if (action.payload.subset) {
        bc.subset = action.payload.subset
        bc.version = null
        bc.representation = null
      }
      if (action.payload.version) {
        bc.version = action.payload.version
        bc.representation = null
      }
      if (action.payload.representation) {
        bc.representation = action.payload.representation
      }

      state.breadcrumbs = bc
      return state
    }, // setBreadcrumbs
    setDialog: (state, action) => {
      if (action.payload) state.dialog = action.payload
      else state.dialog = {}
    },
    setReload: (state, action) => {
      state.reload = {
        ...state.reload,
        [action.payload.type]: action.payload.reload,
      }
    },
  }, // reducers
})

export const {
  selectProject,
  setProjectData,
  setFocusedFolders,
  setFocusedSubsets,
  setFocusedVersions,
  setFocusedTasks,
  setSelectedVersions,
  setExpandedFolders,
  setBreadcrumbs,
  setPairing,
  setDialog,
  setReload,
} = contextSlice.actions

export default contextSlice.reducer

import { createSlice } from '@reduxjs/toolkit'

const contextSlice = createSlice({
  name: 'context',
  initialState: {
    projectName: null,
    project: {},
    focusedType: null,
    focusedFolders: [],
    focusedSubsets: [],
    focusedVersions: [],
    pairing: [],
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

    setFocusedFolders: (state, action) => {
      state.focusedType = 'folder'
      state.focusedFolders = action.payload
      state.focusedSubsets = []
      state.focusedVersions = []
    },

    setFocusedSubsets: (state, action) => {
      state.focusedType = 'subset'
      state.focusedSubsets = action.payload
      state.focusedVersions = []
    },

    setFocusedVersions: (state, action) => {
      if (action.payload === null) {
        state.focusedType = 'folder'
        state.focusedVersions = []
      } else {
        state.focusedType = 'version'
        state.focusedVersions = action.payload
      }
    },

    clearFocus: (state, action) => {
      state.focusedType = null
      state.focusedFolders = []
      state.focusedSubsets = []
      state.focusedVersions = []
    },

    setPairing: (state, action) => {
      console.log("setPairing", action.payload)
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
  }, // reducers
})

export const {
  selectProject,
  setProjectData,
  setFocusedFolders,
  setFocusedSubsets,
  setFocusedVersions,
  setBreadcrumbs,
  setPairing,
} = contextSlice.actions

export default contextSlice.reducer

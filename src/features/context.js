import { createSlice } from '@reduxjs/toolkit'

const contextSlice = createSlice({
  name: 'context',
  initialState: {
    projectName: null,
    project: {},
    expandedFolders: {},
    focused: {
      type: null,
      folders: [],
      subsets: [],
      versions: [],
      tasks: [],
    },
    selectedVersions: {},
    pairing: [],
    dialog: {
      type: null,
    },
    reload: {},
    breadcrumbs: {},
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
      state.focused.type = 'folder'
      state.focused.folders = action.payload
      state.focused.subsets = []
      state.focused.versions = []
      state.pairing = []
    },

    setFocusedSubsets: (state, action) => {
      state.focused.type = 'subset'
      state.focused.subsets = action.payload
      state.focused.versions = []
    },

    setFocusedTasks: (state, action) => {
      state.focused.type = 'task'
      state.focused.tasks = action.payload
      state.focused.versions = []
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
      state.focused.subsets = []
      state.focused.versions = []
    },

    setPairing: (state, action) => {
      state.pairing = action.payload
    },
    subsetSelected: (state, action) => {
      state.focused.type = 'version'
      state.focused.versions = action.payload.versions
      state.focused.subsets = action.payload.subsets
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
  setFocusedType,
  subsetSelected,
} = contextSlice.actions

export default contextSlice.reducer

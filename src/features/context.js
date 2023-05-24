import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  expandedFolders: {},
  focused: {
    type: null,
    folders: [],
    subsets: [],
    versions: [],
    tasks: [],
    editor: [],
  },
  selectedVersions: {},
  pairing: [],
  reload: {},
  breadcrumbs: { scope: '' },
  share: { name: null, data: null, link: null, img: null },
  uri: null,
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

    setUri: (state, action) => {
      //console.log('setUri', action.payload)
      state.uri = action.payload
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
  }, // reducers
})

export const {
  setFocusedFolders,
  setFocusedSubsets,
  setFocusedVersions,
  setFocusedTasks,
  setSelectedVersions,
  setExpandedFolders,
  setPairing,
  setReload,
  setFocusedType,
  setUri,
  subsetSelected,
  editorSelectionChanged,
  projectSelected,
  onShare,
  closeShare,
  selectProject,
} = contextSlice.actions

export default contextSlice.reducer

import { createSlice } from '@reduxjs/toolkit'

const editorSlice = createSlice({
  name: 'editor',
  initialState: {
    projectName: null,
    nodes: {},
    new: {},
    changes: {},
  },
  reducers: {
    branchesLoaded: (state, action) => {
      // add all new nodes
      for (const id in action.payload) {
        state.nodes[id] = action.payload[id]
      }
    },
    nodesUpdated: (state, action) => {
      const { updated = [], deleted = [] } = action.payload
      // add new updated nodes
      for (const node of updated) {
        state.nodes[node?.data?.id] = node
      }
      // delete nodes
      for (const id of deleted) {
        delete state.nodes[id]
      }
      // reset any changes if not forcedSave
      if (!action.payload.forcedSave) {
        state.new = {}
        state.changes = {}
      }
    },
    updateNodes: (state, action) => {
      // only updates provided fields
      const { updated } = action.payload
      // add new updated nodes
      for (const node of updated) {
        if (state.nodes[node?.id]) {
          for (const key in node) {
            if (key === 'id') continue
            state.nodes[node?.id].data[key] = node[key]
          }
        }
      }
    },
    newNodesAdded: (state, { payload = [] }) => {
      for (const node of payload) {
        const id = node.id
        state.new[id] = node
      }
    },
    newProject: (state, action) => {
      state.nodes = {}
      state.new = {}
      state.changes = {}
      state.projectName = action.payload
    },
    onNewChanges: (state, { payload = [] }) => {
      for (const { id, ...node } of payload) {
        state.changes[id] = { ...(state.changes[id] || {}), ...node }
      }
    },
    onForceChange: (state, { payload = {} }) => {
      // remove forced fields from changes
      const { ids, keys } = payload
      for (const id of ids) {
        for (const key of keys) {
          if (state.changes[id]) {
            delete state.changes[id][key]
          }
        }
        // if there are no changes left delete the node
        if (Object.keys(state.changes[id]).filter((key) => !key.includes('__')).length === 0) {
          delete state.changes[id]
        }
      }
    },
    onRevert: (state, { payload }) => {
      // if ids are provided only delete those
      if (payload) {
        for (const id of payload) {
          if (state.new[id]) delete state.new[id]
          if (state.changes[id]) delete state.changes[id]
        }
      } else {
        // reset all changes
        state.new = {}
        state.changes = {}
      }
    },
    onProjectChange: (state) => {
      state.nodes = {}
      state.new = {}
      state.changes = {}
    },
  },
})

export const {
  branchesLoaded,
  nodesUpdated,
  onRevert,
  newNodesAdded,
  onNewChanges,
  newProject,
  updateNodes,
  onProjectChange,
  onForceChange,
} = editorSlice.actions
export default editorSlice.reducer

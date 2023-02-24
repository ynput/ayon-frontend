import { createSlice } from '@reduxjs/toolkit'

const editorSlice = createSlice({
  name: 'editor',
  initialState: {
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
      // reset any changes
      state.new = {}
      state.changes = {}
    },
    newNodesAdded: (state, { payload = [] }) => {
      for (const node of payload) {
        const id = node.id
        state.new[id] = node
      }
    },
    onNewChanges: (state, { payload = [] }) => {
      for (const node of payload) {
        const id = node.id
        delete node.id
        state.changes[id] = node
      }
    },
    onRevert: (state, { payload = [] }) => {
      // if ids are provided only delete those
      if (payload.length) {
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
  },
})

export const { branchesLoaded, nodesUpdated, onRevert, newNodesAdded, onNewChanges } =
  editorSlice.actions
export default editorSlice.reducer

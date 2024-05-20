import { createSlice } from '@reduxjs/toolkit'

const previewSlice = createSlice({
  name: 'preview',
  initialState: {
    selected: [],
    entityType: null,
  },
  reducers: {
    openPreview: (state, { payload: { selected, entityType = 'version' } = {} } = {}) => {
      state.selected = selected
      state.entityType = entityType
    },
    updateSelection: (state, { payload: { selected } }) => {
      state.selected = selected
    },
    closePreview: (state) => {
      state.selected = []
      state.entityType = null
    },
  },
})

export const { openPreview, updateSelection, closePreview } = previewSlice.actions
export default previewSlice.reducer

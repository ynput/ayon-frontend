import { createSlice } from '@reduxjs/toolkit'

const previewSlice = createSlice({
  name: 'preview',
  initialState: {
    selected: [],
    projectName: null,
  },
  reducers: {
    openPreview: (state, { payload: { selected, projectName } = {} } = {}) => {
      state.selected = selected
      state.projectName = projectName
    },
    updateSelection: (state, { payload: { selected } }) => {
      state.selected = selected
    },
    closePreview: (state) => {
      state.selected = []
      state.projectName = null
    },
  },
})

export const { openPreview, updateSelection, closePreview } = previewSlice.actions
export default previewSlice.reducer

import { createSlice } from '@reduxjs/toolkit'

const previewSlice = createSlice({
  name: 'preview',
  initialState: {
    productId: null,
    versionIds: [],
    projectName: null,
  },
  reducers: {
    openPreview: (state, { payload: { versionIds, projectName, productId } = {} } = {}) => {
      state.productId = productId
      state.versionIds = versionIds
      state.projectName = projectName
    },
    updateSelection: (state, { payload: { versionIds } }) => {
      state.versionIds = versionIds
    },
    closePreview: (state) => {
      state.versionIds = []
      state.projectName = null
    },
  },
})

export const { openPreview, updateSelection, closePreview } = previewSlice.actions
export default previewSlice.reducer

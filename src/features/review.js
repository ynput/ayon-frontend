import { createSlice } from '@reduxjs/toolkit'

const reviewSlice = createSlice({
  name: 'review',
  initialState: {
    productId: null,
    versionIds: [],
    projectName: null,
  },
  reducers: {
    openReview: (state, { payload: { versionIds, projectName, productId } = {} } = {}) => {
      state.productId = productId
      state.versionIds = versionIds
      state.projectName = projectName
    },
    updateSelection: (state, { payload: { versionIds } }) => {
      state.versionIds = versionIds
    },
    closeReview: (state) => {
      state.versionIds = []
      state.projectName = null
    },
  },
})

export const { openReview, updateSelection, closeReview } = reviewSlice.actions
export default reviewSlice.reducer

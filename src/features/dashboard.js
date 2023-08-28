import { createSlice } from '@reduxjs/toolkit'

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    selectedProjects: [],
  },
  reducers: {
    onProjectSelected: (state, { payload = [] }) => {
      state.selectedProjects = payload
    },
  },
})

export const { onProjectSelected } = dashboardSlice.actions
export default dashboardSlice.reducer

import { createSlice } from '@reduxjs/toolkit'
import getInitialStateLocalStorage from './middleware/getInitialStateLocalStorage'

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    selectedProjects: getInitialStateLocalStorage('dashboard-selectedProjects', [[]]),
  },
  reducers: {
    onProjectSelected: (state, { payload = [] }) => {
      state.selectedProjects = payload
    },
  },
})

export const { onProjectSelected } = dashboardSlice.actions
export default dashboardSlice.reducer

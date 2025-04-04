import { createSlice } from '@reduxjs/toolkit'

interface ProjectOverviewState {
  showHierarchy: boolean
}

const initialState = {
  selected: {
    ids: [],
    type: 'task',
  },
  detailsOpen: false,
} satisfies ProjectOverviewState as ProjectOverviewState

const projectOverviewSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {},
})

export const { selectProgress, toggleDetailsOpen } = projectOverviewSlice.actions
export default projectOverviewSlice.reducer

import { createSlice } from '@reduxjs/toolkit'
import getInitialStateLocalStorage from './middleware/getInitialStateLocalStorage'

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    selectedProjects: getInitialStateLocalStorage('dashboard-selectedProjects'),
    tasks: {
      selected: getInitialStateLocalStorage('dashboard-tasks-selected', []),
      sortBy: getInitialStateLocalStorage('dashboard-tasks-sortBy', []),
      groupBy: getInitialStateLocalStorage('dashboard-tasks-groupBy', []),
      filter: getInitialStateLocalStorage('dashboard-tasks-filter', ''),
      assignees: getInitialStateLocalStorage('dashboard-tasks-assignees', null),
      attributesOpen: getInitialStateLocalStorage('dashboard-tasks-attributesOpen', false),
    },
  },
  reducers: {
    onProjectSelected: (state, { payload = [] }) => {
      state.selectedProjects = payload
    },
    onTaskSelected: (state, { payload = [] }) => {
      state.tasks.selected = payload
    },
    onTasksSortByChanged: (state, { payload = [] }) => {
      state.tasks.sortBy = payload
    },
    onTasksGroupByChanged: (state, { payload = [] }) => {
      state.tasks.groupBy = payload
    },
    onTasksFilterChanged: (state, { payload = [] }) => {
      state.tasks.filter = payload
    },
    onAssigneesChanged: (state, { payload = [] }) => {
      state.tasks.assignees = payload
    },
    onAttributesOpenChanged: (state, { payload = [] }) => {
      state.tasks.attributesOpen = payload
    },
  },
})

export const {
  onProjectSelected,
  onTaskSelected,
  onTasksSortByChanged,
  onTasksGroupByChanged,
  onTasksFilterChanged,
  onAssigneesChanged,
  onAttributesOpenChanged,
} = dashboardSlice.actions
export default dashboardSlice.reducer

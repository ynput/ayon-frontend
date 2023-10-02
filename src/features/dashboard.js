import { createSlice } from '@reduxjs/toolkit'
import getInitialStateLocalStorage from './middleware/getInitialStateLocalStorage'

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    selectedProjects: getInitialStateLocalStorage('dashboard-selectedProjects', []),
    prefetchedIds: [],
    tasks: {
      selected: getInitialStateLocalStorage('dashboard-tasks-selected', []),
      sortBy: getInitialStateLocalStorage('dashboard-tasks-sortBy', []),
      groupBy: getInitialStateLocalStorage('dashboard-tasks-groupBy', []),
      filter: getInitialStateLocalStorage('dashboard-tasks-filter', ''),
      assignees: getInitialStateLocalStorage('dashboard-tasks-assignees', []),
      assigneesIsMe: getInitialStateLocalStorage('dashboard-tasks-assigneesIsMe', true),
      attributesOpen: getInitialStateLocalStorage('dashboard-tasks-attributesOpen', true),
      collapsedColumns: getInitialStateLocalStorage('dashboard-tasks-collapsedColumns', []),
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
    onTasksFilterChanged: (state, { payload = '' }) => {
      state.tasks.filter = payload
    },
    onAssigneesChanged: (state, { payload: { assignees = [], assigneesIsMe = false } }) => {
      state.tasks.assignees = assignees
      state.tasks.assigneesIsMe = assigneesIsMe
    },
    onAttributesOpenChanged: (state, { payload }) => {
      state.tasks.attributesOpen = payload
    },
    onCollapsedColumnsChanged: (state, { payload }) => {
      state.tasks.collapsedColumns = payload
    },
    onPrefetchIds: (state, { payload }) => {
      state.prefetchedIds = payload
    },
    onClearDashboard: (state) => {
      state.selectedProjects = []
      state.prefetchedIds = []
      state.tasks.selected = []
      state.tasks.sortBy = []
      state.tasks.groupBy = []
      state.tasks.filter = ''
      state.tasks.assignees = []
      state.tasks.assigneesIsMe = false
      state.tasks.attributesOpen = true
      state.tasks.collapsedColumns = []
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
  onCollapsedColumnsChanged,
  onPrefetchIds,
  onClearDashboard,
} = dashboardSlice.actions
export default dashboardSlice.reducer

// topics that need to set localStorage. If there is no explicit value, it will be the payload value
export const dashboardLocalItems = {
  'dashboard/onProjectSelected': [{ key: 'dashboard-selectedProjects' }],
  'dashboard/onTasksSortByChanged': [{ key: 'dashboard-tasks-sortBy' }],
  'dashboard/onTasksGroupByChanged': [{ key: 'dashboard-tasks-groupBy' }],
  'dashboard/onTasksFilterChanged': [{ key: 'dashboard-tasks-filter' }],
  'dashboard/onTaskSelected': [{ key: 'dashboard-tasks-selected' }],
  'dashboard/onAssigneesChanged': [
    { key: 'dashboard-tasks-assignees', payload: 'assignees' },
    { key: 'dashboard-tasks-assigneesIsMe', payload: 'assigneesIsMe' },
  ],
  'dashboard/onAssigneeIsMeChanged': [{ key: 'dashboard-tasks-assigneesIsMe' }],
  'dashboard/onAttributesOpenChanged': [{ key: 'dashboard-tasks-attributesOpen' }],
  'dashboard/onCollapsedColumnsChanged': [{ key: 'dashboard-tasks-collapsedColumns' }],
}

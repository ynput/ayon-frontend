import { createSlice } from '@reduxjs/toolkit'
import getInitialStateLocalStorage from './middleware/getInitialStateLocalStorage'

export const filterActivityTypes = {
  activity: ['comment', 'version.publish', 'status.change', 'assignee.add', 'assignee.remove'],
  comments: ['comment'],
  publishes: ['version.publish'],
  checklists: ['checklist'],
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    selectedProjects: getInitialStateLocalStorage('dashboard-selectedProjects', []),
    prefetchedIds: [],
    tasks: {
      selected: getInitialStateLocalStorage('dashboard-tasks-selected', []),
      types: getInitialStateLocalStorage('dashboard-tasks-types', []),
      sortBy: getInitialStateLocalStorage('dashboard-tasks-sortBy', []),
      groupBy: getInitialStateLocalStorage('dashboard-tasks-groupBy', []),
      filter: getInitialStateLocalStorage('dashboard-tasks-filter', ''),
      assignees: getInitialStateLocalStorage('dashboard-tasks-assignees', []),
      assigneesFilter: getInitialStateLocalStorage('dashboard-tasks-assigneesFilter', 'me'),
      collapsedColumns: getInitialStateLocalStorage('dashboard-tasks-collapsedColumns', []),
      draggingIds: [],
    },
  },
  reducers: {
    onProjectSelected: (state, { payload = [] }) => {
      state.selectedProjects = payload
    },
    onProjectOpened: (state, { payload }) => {
      // check if project is already selected
      if (state.selectedProjects.includes(payload)) return
      state.selectedProjects = [payload]
    },
    onTaskSelected: (state, { payload = {} }) => {
      state.tasks.selected = payload.ids
      state.tasks.types = payload.types
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
    onAssigneesChanged: (state, { payload: { assignees = [], filter } }) => {
      state.tasks.assignees = assignees
      state.tasks.assigneesFilter = filter
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
      state.tasks.assigneesFilter = 'me'
      state.tasks.collapsedColumns = []
    },
    onDraggingStart: (state, { payload }) => {
      state.tasks.draggingIds = payload
    },
    onDraggingEnd: (state) => {
      state.tasks.draggingIds = []
    },
  },
})

export const {
  onProjectSelected,
  onProjectOpened,
  onTaskSelected,
  onTasksSortByChanged,
  onTasksGroupByChanged,
  onTasksFilterChanged,
  onAssigneesChanged,
  onCollapsedColumnsChanged,
  onPrefetchIds,
  onClearDashboard,
  onDraggingStart,
  onDraggingEnd,
} = dashboardSlice.actions
export default dashboardSlice.reducer

// topics that need to set localStorage. If there is no explicit value, it will be the payload value
export const dashboardLocalItems = {
  'dashboard/onProjectSelected': [{ key: 'dashboard-selectedProjects' }],
  'dashboard/onTasksSortByChanged': [{ key: 'dashboard-tasks-sortBy' }],
  'dashboard/onTasksGroupByChanged': [{ key: 'dashboard-tasks-groupBy' }],
  'dashboard/onTasksFilterChanged': [{ key: 'dashboard-tasks-filter' }],
  'dashboard/onTaskSelected': [
    { key: 'dashboard-tasks-selected', payload: 'ids' },
    { key: 'dashboard-tasks-types', payload: 'types' },
  ],
  'dashboard/onAssigneesChanged': [
    { key: 'dashboard-tasks-assignees', payload: 'assignees' },
    { key: 'dashboard-tasks-assigneesFilter', payload: 'filter' },
  ],
  'dashboard/onCollapsedColumnsChanged': [{ key: 'dashboard-tasks-collapsedColumns' }],
}

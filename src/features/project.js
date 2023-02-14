import { createSlice } from '@reduxjs/toolkit'

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    name: null,
    folders: {},
    foldersOrder: [],
    tasks: {},
    tasksOrder: [],
    statuses: {},
    statusesOrder: [],
    tags: {},
    tagsOrder: [],
    // families: {},
  },
  reducers: {
    selectProject: (state, action) => {
      window.localStorage.setItem('currentProject', action.name)
      state.name = action.payload
    },
    setProjectData: (state, action) => {
      state.folders = action.payload.folders || {}
      state.tasks = action.payload.tasks || {}
      state.statuses = action.payload.statuses || {}
      state.tags = action.payload.tags || {}
      // state.families = action.payload.families || {}
      state.foldersOrder = action.payload.order?.folders || []
      state.tasksOrder = action.payload.order?.tasks || []
      state.statusesOrder = action.payload.order?.statuses || []
      state.tagsOrder = action.payload.order?.tags || []
    },
  },
})

export const { selectProject, setProjectData } = projectSlice.actions

export default projectSlice.reducer

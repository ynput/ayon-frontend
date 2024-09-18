import { createSlice } from '@reduxjs/toolkit'

export const productTypes = {
  image: { name: 'image', icon: 'imagesmode' },
  render: { name: 'render', icon: 'photo_library' },
  plate: { name: 'plate', icon: 'camera_roll' },
  camera: { name: 'camera', icon: 'videocam' },
  model: { name: 'model', icon: 'language' },
  texture: { name: 'texture', icon: 'texture' },
  look: { name: 'look', icon: 'ev_shadow' },
  rig: { name: 'rig', icon: 'accessibility' },
  animation: { name: 'animation', icon: 'directions_run' },
  cache: { name: 'cache', icon: 'animation' },
  layout: { name: 'layout', icon: 'nature_people' },
  setdress: { name: 'setdress', icon: 'forest' },
  groom: { name: 'groom', icon: 'content_cut' },
  matchmove: { name: 'matchmove', icon: 'switch_video' },
  vdbcache: { name: 'vdbcache', icon: 'local_fire_department' },
  lightrig: { name: 'lightrig', icon: 'wb_incandescent' },
  lut: { name: 'lut', icon: 'opacity' },
  workfile: { name: 'workfile', icon: 'home_repair_service' },
}

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
    attrib: {},
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
      state.foldersOrder = action.payload.order?.folders || []
      state.tasksOrder = action.payload.order?.tasks || []
      state.statusesOrder = action.payload.order?.statuses || []
      state.tagsOrder = action.payload.order?.tags || []
      // other project data
      state.attrib = action.payload.attrib
    },
  },
})

export const { selectProject, setProjectData } = projectSlice.actions

export default projectSlice.reducer

import { sortBy } from 'lodash'

//
// Icons
//

const FOLDER_TYPE_ICONS = {}
const TASK_TYPE_ICONS = {}
const STATUS_COLORS = {}
const STATUS_ICONS = {}
const STATUS_SHORT_NAMES = {}
const TAG_COLORS = {}

const getFolderTypeIcon = (folderType) => {
  if (!folderType) return 'folder'
  return FOLDER_TYPE_ICONS[folderType] || 'help_center'
}

const updateFolderTypeIcons = (data) => {
  for (const name in data) {
    FOLDER_TYPE_ICONS[name] = data[name]
  }
}

const getTaskTypeIcon = (taskType) => {
  // make sure first letter is always capitalized
  taskType = taskType.charAt(0).toUpperCase() + taskType.slice(1)
  return TASK_TYPE_ICONS[taskType] || 'help_center'
}

const updateTaskTypeIcons = (data) => {
  for (const name in data) {
    TASK_TYPE_ICONS[name] = data[name]
  }
}

const getStatusProps = (status, anatomy = {}) => {
  return {
    color: STATUS_COLORS[status] || (anatomy[status] && anatomy[status].color) || '#c0c0c0',
    icon:
      STATUS_ICONS[status] || (anatomy[status] && anatomy[status].icon) || 'radio_button_checked',
    shortName:
      STATUS_SHORT_NAMES[status] || (anatomy[status] && anatomy[status].shortName) || 'ERR',
  }
}

const updateStatusColors = (data) => {
  for (const name in data) {
    STATUS_COLORS[name] = data[name]
  }
}
const updateStatusIcons = (data) => {
  for (const name in data) {
    STATUS_ICONS[name] = data[name]
  }
}
const updateStatusShortNames = (data) => {
  for (const name in data) {
    STATUS_SHORT_NAMES[name] = data[name]
  }
}

const getTagColor = (status) => {
  return TAG_COLORS[status] || '#c0c0c0'
}

const updateTagColors = (data) => {
  for (const name in data) {
    TAG_COLORS[name] = data[name]
  }
}

const getFolderTypes = () => {
  let result = []
  for (const name in FOLDER_TYPE_ICONS)
    result.push({ name, label: name, icon: FOLDER_TYPE_ICONS[name] })
  return sortBy(result, 'name')
}

const getTaskTypes = () => {
  let result = []
  for (const name in TASK_TYPE_ICONS)
    result.push({ name, label: name, icon: TASK_TYPE_ICONS[name] })
  return sortBy(result, 'name')
}

//
// Export
//

export {
  getFolderTypeIcon,
  getTaskTypeIcon,
  getStatusProps,
  getTagColor,
  getFolderTypes,
  getTaskTypes,
  updateFolderTypeIcons,
  updateTaskTypeIcons,
  updateStatusColors,
  updateStatusIcons,
  updateStatusShortNames,
  updateTagColors,
}

import axios from 'axios'

const arrayEquals = (a, b) => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  )
}

const sortByKey = (array, key) => {
  // Return a copy of array of objects sorted
  // by the given key
  return array.sort(function (a, b) {
    var x = a[key]
    var y = b[key]
    return x < y ? -1 : x > y ? 1 : 0
  })
}

const isGroupable = (data, key, value) => {
  // Returns true if the key with the given value is
  // presented multiple times in the array
  // and therefore can be grouped.
  let count = 0
  for (const item of data) {
    if (item[key] === value) {
      count++
      if (count > 1) return true
    }
  }
  return false
}

const groupResult = (data, groupBy, key = 'id') => {
  // Transform a list of records to a TreeTable-compatible structure
  // with grouped records.
  let result = []
  let existingGroups = []
  for (const item of data) {
    // Unique items. Just add to root
    if (!isGroupable(data, groupBy, item[groupBy])) {
      result.push({ key: item[key], data: item })
    }

    // Item of an existing group
    else if (existingGroups.includes(item[groupBy])) {
      for (const group of result) {
        if (group.data[groupBy] === item[groupBy]) {
          group.children.push({
            key: item[key],
            data: item,
          })
          break
        }
      }
    }

    // New group
    else {
      existingGroups.push(item[groupBy])
      result.push({
        key: `group-${item[groupBy]}`,
        data: {
          [groupBy]: item[groupBy],
          isGroup: true,
        },
        children: [
          {
            key: item[key],
            data: item,
          },
        ],
      })
    }
  }
  return result
}

const loadAnatomyPresets = async () => {
  const defaultPreset = { name: '_', title: '<default (built-in)>' }
  let response
  try {
    response = await axios.get('/api/anatomy/presets')
  } catch (error) {
    return []
  }
  let primaryPreset = defaultPreset
  let presets = []
  for (const preset of response.data.presets) {
    if (preset.primary)
      primaryPreset = { name: preset.name, title: `<default (${preset.name})>` }
    presets.push({
      name: preset.name,
      title: preset.name,
      version: preset.version,
      primary: preset.primary ? 'PRIMARY' : '',
    })
  }
  return [primaryPreset, ...presets]
}


//
// Icons
//

const FOLDER_TYPE_ICONS = {}
const TASK_TYPE_ICONS = {}
const FAMILY_ICONS = {
  image: 'imagesmode',
  render: 'photo_library',
  plate: 'camera_roll',
  camera: 'videocam',
  model: 'language',
  texture: 'texture',
  look: 'ev_shadow',
  rig: 'accessibility',
  animation: 'directions_run',
  cache: 'animation',
  layout: 'nature_people',
  setdress: 'forest',
  groom: 'content_cut',
  matchmove: 'switch_video',
  vdb: 'local_fire_department',
  lightrig: 'wb_incandescent',
  lut: 'opacity',
}

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
  return TASK_TYPE_ICONS[taskType] || 'help_center'
}

const updateTaskTypeIcons = (data) => {
  for (const name in data) {
    TASK_TYPE_ICONS[name] = data[name]
  }
}

const getFamilyIcon = (family) => {
  return FAMILY_ICONS[family] || 'help_center'
}

//
// Export
//


export {
  arrayEquals,
  loadAnatomyPresets,
  groupResult,
  sortByKey,
  getFolderTypeIcon,
  getTaskTypeIcon,
  getFamilyIcon,
  updateFolderTypeIcons,
  updateTaskTypeIcons,
}

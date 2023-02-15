import { useState } from 'react'
import { isEmpty, isEqual, xorWith, cloneDeep, sortBy } from 'lodash'

const arrayEquals = (x, y) => isEmpty(xorWith(x, y, isEqual))
const deepCopy = (obj) => cloneDeep(obj)

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

export const parseTasksList = (tasks, userName) => {
  const parsed = tasks.map(({ node: { id, name, label, folder, taskType, assignees } }) => ({
    id: id,
    name: name,
    label: label,
    folderName: folder.label || folder.name,
    taskType: taskType,
    isMine: assignees.includes(userName) ? 'yes' : '',
  }))

  const grouped = groupResult(parsed, 'name')

  return grouped
}

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

function useLocalStorage(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // If error also return initialValue
      console.log(error)
      return initialValue
    }
  })
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // Save state
      setStoredValue(valueToStore)
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error)
    }
  }
  return [storedValue, setValue]
}

//
// Export
//

export {
  arrayEquals,
  deepCopy,
  groupResult,
  sortByKey,
  getFolderTypeIcon,
  getTaskTypeIcon,
  getStatusProps,
  getTagColor,
  getFolderTypes,
  getTaskTypes,
  isEmpty,
  updateFolderTypeIcons,
  updateTaskTypeIcons,
  updateStatusColors,
  updateStatusIcons,
  updateStatusShortNames,
  updateTagColors,
  useLocalStorage,
}

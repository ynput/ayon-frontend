//
// Icons
//

const STATUS_COLORS = {}
const STATUS_ICONS = {}
const STATUS_SHORT_NAMES = {}
const TAG_COLORS = {}

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

//
// Export
//

export {
  getStatusProps,
  getTagColor,
  updateStatusColors,
  updateStatusIcons,
  updateStatusShortNames,
  updateTagColors,
}

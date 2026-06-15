export const GROUP_BY_FOLDER_KEY = 'projectFolder'

const CORE_DEFAULT_COLUMNS = {
  thumbnail: true,
  name: true,
  label: true,
  status: true,
  subType: true,
}

export const DEFAULT_COLUMNS_FOLDER = {
  ...CORE_DEFAULT_COLUMNS,
  attrib_priority: true,
  attrib_description: true,
  folder: true,
}
export const DEFAULT_COLUMNS_TASK = {
  ...CORE_DEFAULT_COLUMNS,
  assignees: true,
  attrib_priority: true,
  attrib_description: true,
  folder: true,
}
export const DEFAULT_COLUMNS_VERSION = {
  ...CORE_DEFAULT_COLUMNS,
  author: true,
  folder: true,
  version: true,
}

export const DEFAULT_COLUMNS_PRODUCT = {
  ...CORE_DEFAULT_COLUMNS,
  productType: true,
  folder: true,
}

export const DEFAULT_COLUMNS_PROJECT = {
  thumbnail: true,
  label: true,
  name: false,
  code: true,
  active: true,
  heartbeat: true,
  library: true,
  pipeline: true,
  attrib_endDate: true,
  createdAt: true,
}

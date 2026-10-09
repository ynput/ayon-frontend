// options and default order
export const FEATURED_VERSION_TYPES = [
  { value: 'hero', label: 'Hero', short: 'Hero', icon: 'star' },
  { value: 'latestDone', label: 'Latest Done', short: 'Done', icon: 'check_circle' },
  { value: 'latest', label: 'Latest', short: 'Latest', icon: 'fiber_new' },
]
export const DEFAULT_FEATURED_ORDER = FEATURED_VERSION_TYPES.map((option) => option.value)

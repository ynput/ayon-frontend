import type { EventItem, Severity } from '../types'

export const getCategory = (topic: string) => topic.split('.')[0]

export type CategoryMeta = { label: string; icon: string; color: string }

// muted hues that stay readable on the dark surfaces, severity colours are reserved for logs
const CATEGORY_META: Record<string, CategoryMeta> = {
  entity: { label: 'Entity', icon: 'deployed_code', color: '#7fa7e6' },
  activity: { label: 'Activity', icon: 'forum', color: '#a58be0' },
  entity_list: { label: 'Lists', icon: 'list', color: '#6fc2c2' },
  auth: { label: 'Auth', icon: 'key', color: '#d7a26b' },
  server: { label: 'Server', icon: 'dns', color: '#9aa4b2' },
  bundle: { label: 'Bundle', icon: 'inventory_2', color: '#c890c8' },
  addon: { label: 'Addon', icon: 'extension', color: '#7fc79a' },
  settings: { label: 'Settings', icon: 'settings', color: '#b9b07a' },
  thumbnail: { label: 'Thumbnail', icon: 'image', color: '#8fb3a6' },
  reviewable: { label: 'Reviewable', icon: 'play_circle', color: '#e08fa3' },
  inbox: { label: 'Inbox', icon: 'inbox', color: '#8fa7b9' },
  log: { label: 'Logs', icon: 'terminal', color: '#9aa4b2' },
}

const FALLBACK_COLORS = ['#a3b48a', '#b49a8a', '#8aa3b4', '#b48aa8', '#8ab4a0']

export const KNOWN_CATEGORIES = Object.keys(CATEGORY_META)

export const getCategoryMeta = (category: string): CategoryMeta => {
  const meta = CATEGORY_META[category]
  if (meta) return meta
  const hash = [...category].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return {
    label: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
    icon: 'label',
    color: FALLBACK_COLORS[hash % FALLBACK_COLORS.length],
  }
}

export const SEVERITIES: { value: Severity; label: string; icon: string; color: string }[] = [
  { value: 'error', label: 'Error', icon: 'error', color: 'var(--md-sys-color-error)' },
  { value: 'warning', label: 'Warning', icon: 'warning', color: 'var(--md-sys-color-warning)' },
  { value: 'info', label: 'Info', icon: 'info', color: 'var(--md-sys-color-primary)' },
  { value: 'debug', label: 'Debug', icon: 'bug_report', color: 'var(--md-sys-color-outline)' },
]

/** Visual severity of any event: log level for logs, otherwise derived from the status */
export const getSeverity = (event: Pick<EventItem, 'topic' | 'status'>): Severity | null => {
  if (event.topic.startsWith('log.')) {
    const level = event.topic.split('.')[1] as Severity
    return SEVERITIES.some((s) => s.value === level) ? level : 'info'
  }
  if (event.status === 'failed') return 'error'
  if (event.status === 'aborted') return 'warning'
  return null
}

export const getSeverityMeta = (severity: Severity | null) =>
  SEVERITIES.find((s) => s.value === severity)

export const STATUSES: { value: string; label: string; icon: string }[] = [
  { value: 'finished', label: 'Finished', icon: 'check_circle' },
  { value: 'pending', label: 'Pending', icon: 'schedule' },
  { value: 'in_progress', label: 'In progress', icon: 'progress_activity' },
  { value: 'failed', label: 'Failed', icon: 'cancel' },
  { value: 'aborted', label: 'Aborted', icon: 'block' },
  { value: 'restarted', label: 'Restarted', icon: 'history' },
]

export const getStatusMeta = (status: string) =>
  STATUSES.find((s) => s.value === status) ?? { value: status, label: status, icon: 'help' }

export const isActiveStatus = (status: string) => status === 'pending' || status === 'in_progress'

/** The entity an event refers to, if any */
export const getEventEntity = (
  event: EventItem,
): { id: string; type?: string; path?: string } | null => {
  const { summary, topic } = event
  if (topic.includes('reviewable') && summary.versionId) {
    return { id: summary.versionId, type: 'version' }
  }
  if (!summary.entityId) return null
  const [category, type] = topic.split('.')
  return {
    id: summary.entityId,
    type: category === 'entity' ? type : summary.entityType,
    path: summary.entityPath,
  }
}

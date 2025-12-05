import type { InboxMessage } from '@/services/inbox/inboxTransform'
import type { GetProjectsInfoResponse } from '@shared/api'

// Activity types that can appear in the inbox
export type InboxActivityType =
  | 'comment'
  | 'version.publish'
  | 'assignee.add'
  | 'assignee.remove'
  | 'assignee.reassign'
  | 'reviewable'
  | 'status.change'

// Filter type for inbox tabs
export type InboxFilter = 'important' | 'other' | 'cleared'

// Filter arguments used for queries
export interface InboxFilterArgs {
  active: boolean
  important: boolean | null
}

// Projects info record type - compatible with GetProjectsInfoResponse
export type ProjectsInfo = GetProjectsInfoResponse

// Author info from inbox message
export interface MessageAuthor {
  name?: string
  attrib?: {
    fullName?: string
  }
}

// Activity data parsed from JSON
export interface ActivityData {
  assignee?: string
  newValue?: string
  oldValue?: string
  parents?: Array<{
    id: string
    type: string
    name: string
    label?: string
  }>
  context?: {
    productName?: string
  }
}

// Extend InboxMessage to have parsed activityData
export interface InboxMessageWithParsedData extends Omit<InboxMessage, 'activityData'> {
  activityData: ActivityData
}

// Grouped message structure after transformation
export interface GroupedMessage {
  activityId: string
  groupIds: string[]
  activityType: InboxActivityType | string
  projectName: string
  entityId: string | null | undefined
  entityType: string | null | undefined
  entitySubType?: string | null
  userName?: string
  changes: string[]
  read: boolean
  unRead: number
  path: string[]
  date: string
  img: string
  isMultiple: boolean
  messages: InboxMessage[]
  body?: string
  isPlaceholder?: boolean
  active?: boolean
}

// Placeholder message when loading
export interface PlaceholderMessage {
  activityId: string
  folderName: string
  thumbnail: { icon: string }
  read: boolean
  isPlaceholder: boolean
}

// Status info from project
export interface StatusInfo {
  name: string
  icon?: string
  color?: string
}

// Props for status display
export interface InboxStatusChange {
  icon?: string
  color?: string
  name?: string
}

// Message selection handler type
export type MessageSelectHandler = (id: string, ids?: string[]) => void

// Message clear handler type
export type MessageClearHandler = (id: string) => void

// Context menu item
export interface InboxContextMenuItem {
  id: string
  label: string
  icon: string
  shortcut?: string
  disabled?: boolean
  command: () => void
}

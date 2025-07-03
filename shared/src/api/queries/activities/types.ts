import { GetKanbanProjectUsersQuery } from '@shared/api'

type AccessGroups = {
  [key: string]: string[]
}

export type ProjectUser = Omit<
  GetKanbanProjectUsersQuery['users']['edges'][0]['node'],
  'accessGroups'
> & { accessGroups: AccessGroups; projects: string[]; avatarUrl: string }

export type FeedActivityOrigin = {
  id: string
  name: string
  label: string | null
  type: string
  subtype?: string
  link?: string
}

export type FeedActivityParent = {
  id: string
  name: string
  label: string | null
  type: string
  subtype?: string
}

export type FeedActivityAuthor = {
  deleted: boolean
  active: boolean
  name?: string
  attrib: {
    fullName?: string | null
    avatarUrl?: string | null
    [key: string]: any
  }
}

export type FeedActivityFile = {
  id: string
  name?: string | null
  size: string
  mime?: string | null
  author?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type FeedActivityReaction = {
  fullName?: string | null
  userName: string
  reaction: string
  timestamp: string // ISO date string
}

export type FeedActivityVersion = {
  attrib: {
    comment?: string | null
    [key: string]: any
  }
  [key: string]: any
}

export type FeedActivityData = {
  author: string
  files?: Array<FeedActivityFile>
  origin: FeedActivityOrigin
  parents: Array<FeedActivityParent>
  newValue?: string
  oldValue?: string
  // Additional properties for specific activity types
  [key: string]: any
}

export type FeedActivity = {
  activityId: string
  activityType: string | 'end' // e.g. "comment", "status.change"
  activityData: FeedActivityData
  referenceType: string // e.g. "origin", "mention", "relation"
  referenceId: string
  entityId?: string | null
  body: string
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  author: FeedActivityAuthor
  files: Array<FeedActivityFile>
  origin: FeedActivityOrigin
  reactions: Array<FeedActivityReaction>
  version: FeedActivityVersion | null
  authorName: string
  authorFullName: string | null
  authorAvatarUrl?: string
  hasPreviousPage?: boolean
  // Properties added for specific activities
  isOwner?: boolean
  projectName?: string
  active?: boolean
  read?: boolean
  parents?: Array<FeedActivityParent>
}

export type ChecklistCount = {
  total: number
  checked: number
  unChecked: number
  ids: string[]
}

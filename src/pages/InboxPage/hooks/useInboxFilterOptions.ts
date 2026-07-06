import { useMemo } from 'react'
import type { Option } from '@ynput/ayon-react-components'
import type { InboxMessage } from '@/services/inbox/inboxTransform'
import type { MessageAuthor } from '../types'

const ACTIVITY_TYPES: { id: string; label: string; icon: string }[] = [
  { id: 'comment', label: 'Comment', icon: 'forum' },
  { id: 'version.publish', label: 'Version published', icon: 'layers' },
  { id: 'reviewable', label: 'Reviewable', icon: 'play_circle' },
  { id: 'status.change', label: 'Status change', icon: 'arrow_right_alt' },
  { id: 'assignee.add', label: 'Assignee added', icon: 'person_add' },
  { id: 'assignee.remove', label: 'Assignee removed', icon: 'person_remove' },
]

const ENTITY_TYPE_ICONS: Record<string, string> = {
  folder: 'folder',
  task: 'check_circle',
  product: 'inventory_2',
  version: 'layers',
  workfile: 'home_repair_service',
}

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)

// options are derived from already loaded messages, no extra queries
export const useInboxFilterOptions = (messages: InboxMessage[]): Option[] => {
  return useMemo(() => {
    const projects = new Set<string>()
    const entityTypes = new Set<string>()
    const authors = new Map<string, string>()

    for (const message of messages) {
      if (message.projectName) projects.add(message.projectName)
      if (message.entityType) entityTypes.add(message.entityType)
      const author = message.author as MessageAuthor | undefined
      if (author?.name && !authors.has(author.name)) {
        authors.set(author.name, author.attrib?.fullName || author.name)
      }
    }

    const options: Option[] = [
      {
        id: 'activityType',
        type: 'string',
        label: 'Activity',
        icon: 'notifications',
        values: ACTIVITY_TYPES,
      },
      {
        id: 'author',
        type: 'string',
        label: 'Author',
        icon: 'person',
        values: [...authors.entries()].map(([name, fullName]) => ({
          id: name,
          label: fullName,
          icon: 'person',
        })),
      },
      {
        id: 'project',
        type: 'string',
        label: 'Project',
        icon: 'deployed_code',
        values: [...projects].map((name) => ({
          id: name,
          label: name,
          icon: 'deployed_code',
        })),
      },
      {
        id: 'entityType',
        type: 'string',
        label: 'Entity type',
        icon: 'category',
        values: [...entityTypes].map((type) => ({
          id: type,
          label: capitalize(type),
          icon: ENTITY_TYPE_ICONS[type] || 'category',
        })),
      },
      {
        id: 'read',
        type: 'boolean',
        label: 'Read',
        icon: 'drafts',
        singleSelect: true,
        values: [
          { id: 'false', label: 'Unread', icon: 'mark_email_unread' },
          { id: 'true', label: 'Read', icon: 'drafts' },
        ],
      },
    ]

    return options
  }, [messages])
}

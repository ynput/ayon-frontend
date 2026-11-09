import { createElement } from 'react'
import { rankings } from 'match-sorter'
import type { EntityMentionSuggestions, MentionSearchType } from '@shared/api'
import type { ProjectContextValue } from '@shared/context'
import type { TaskType } from '@shared/containers/ProjectTreeTable/types/project'
import getMentionOptions from '@shared/containers/Feed/mentionHelpers/getMentionOptions'
import getMentionUsers from '@shared/containers/Feed/mentionHelpers/getMentionUsers'
import getMentionTasks from '@shared/containers/Feed/mentionHelpers/getMentionTasks'
import getMentionVersions from '@shared/containers/Feed/mentionHelpers/getMentionVersions'
import type { MentionItem, MentionSource } from '../types'
import { getFolderMention, type ProjectMentionLookup } from './useProjectMentionSearch'
import { MentionEntityPicker } from './MentionEntityPicker'

interface FeedMentionSourceOptions {
  suggestions?: EntityMentionSuggestions
  project?: Pick<ProjectContextValue, 'productTypes'>
  taskTypes?: TaskType[]
  folderTypes?: { name: string; icon?: string | null }[]
  // search beyond the suggestions, see `useProjectMentionSearch`
  search?: MentionSource['search']
  // the project of the entities: offers the entity picker of the filtered type and turns
  // pasted links to its entities into mentions, see `useProjectMentionLookup`
  projectName?: string
  lookup?: ProjectMentionLookup
}

// entity types the picker can browse and pasted links can mention
const ENTITY_TYPES: MentionSearchType[] = ['folder', 'task', 'version']

// filter chips of the picker, the ids are the mention types
const FILTERS = [
  { id: 'user', icon: 'person', tooltip: 'Filter users' },
  { id: 'team', icon: 'group', tooltip: 'Filter teams' },
  { id: 'task', icon: 'check_circle', tooltip: 'Filter tasks' },
  { id: 'folder', icon: 'folder', tooltip: 'Filter folders' },
  { id: 'version', icon: 'layers', tooltip: 'Filter versions' },
]

const isMentionItem = (option: unknown): option is MentionItem => !!option

// the first of each list, then the second of each, ... so every type shows within the limit
const interleave = <T>(...lists: T[][]): T[] => {
  const longest = Math.max(0, ...lists.map((list) => list.length))
  const merged: T[] = []
  for (let i = 0; i < longest; i++) lists.forEach((list) => list[i] && merged.push(list[i]))
  return merged
}

/**
 * Mention source backed by the activity feed's mention suggestions (`useGetEntityMentionsQuery`),
 * using the same option builders and sorting as the legacy comment input. One `@` lists users,
 * teams, tasks and versions, plus the project search results (folders too) when `search` is set.
 */
export const createFeedMentionSource = ({
  suggestions = {},
  // version options read the product types
  project = { productTypes: [] },
  taskTypes = [],
  folderTypes,
  search,
  projectName,
  lookup,
}: FeedMentionSourceOptions): MentionSource => ({
  triggers: ['@'],
  config: { '@': { title: '@ Mention', noun: 'result', filters: FILTERS } },
  search,
  browse:
    projectName && lookup
      ? {
          types: ENTITY_TYPES,
          render: (props) => createElement(MentionEntityPicker, { ...props, projectName, lookup }),
        }
      : undefined,
  resolve:
    projectName && lookup
      ? async (ref) => {
          const type = ENTITY_TYPES.find((t) => t === ref.type)
          // links to other projects stay links
          if (ref.projectName !== projectName || !type) return null
          const [item] = await lookup(type, [ref.id])
          return item ?? null
        }
      : undefined,
  getOptions: ({ search: text, filter }) => {
    const users = getMentionUsers(suggestions.users, suggestions.teams)
    const tasks = getMentionTasks(suggestions.tasks, taskTypes)
    const versions = getMentionVersions(suggestions.versions, project as ProjectContextValue)
    // keep the order of the folders: the folder of the entity, then the ones next to it
    const folders = (suggestions.folders ?? []).map((folder, i, all) => ({
      ...getFolderMention(folder, folderTypes),
      relevance: all.length - i,
    }))
    // the helper understands `team:` / `task:` ... prefixes
    const prefix = filter ? `${filter}:` : ''

    // nothing typed: the types take turns, sibling tasks and folders first, each in its own order
    if (!text) {
      return interleave(
        getMentionOptions('@@@', { '@@@': () => tasks }, prefix || undefined),
        getMentionOptions('@', { '@': () => folders }, prefix || undefined),
        getMentionOptions('@', { '@': () => users }, prefix || undefined),
        getMentionOptions('@@', { '@@': () => versions }, prefix || undefined),
      ).filter(isMentionItem)
    }

    // best matches first, whatever the type. With a project search, loose fuzzy matches would
    // push its results out, so only real matches (down to acronyms) are kept.
    return getMentionOptions(
      '@',
      { '@': () => [...tasks, ...folders, ...users, ...versions] },
      prefix + text,
      search ? rankings.ACRONYM : undefined,
    ).filter(isMentionItem)
  },
})

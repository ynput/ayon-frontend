import { rankings } from 'match-sorter'
import type { SuggestResponse } from '@shared/api/generated'
import type { ProjectContextValue } from '@shared/context'
import type { TaskType } from '@shared/containers/ProjectTreeTable/types/project'
import getMentionOptions from '@shared/containers/Feed/mentionHelpers/getMentionOptions'
import getMentionUsers from '@shared/containers/Feed/mentionHelpers/getMentionUsers'
import getMentionTasks from '@shared/containers/Feed/mentionHelpers/getMentionTasks'
import getMentionVersions from '@shared/containers/Feed/mentionHelpers/getMentionVersions'
import type { MentionItem, MentionSource } from '../types'

interface FeedMentionSourceOptions {
  suggestions?: SuggestResponse
  project?: Pick<ProjectContextValue, 'productTypes'>
  taskTypes?: TaskType[]
  // search beyond the suggestions, see `useProjectMentionSearch`
  search?: MentionSource['search']
}

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
  search,
}: FeedMentionSourceOptions): MentionSource => ({
  triggers: ['@'],
  config: { '@': { title: '@ Mention', noun: 'result', filters: FILTERS } },
  search,
  getOptions: ({ search: text, filter }) => {
    const users = getMentionUsers(suggestions.users, suggestions.teams)
    const tasks = getMentionTasks(suggestions.tasks, taskTypes)
    const versions = getMentionVersions(suggestions.versions, project as ProjectContextValue)
    // the helper understands `team:` / `task:` ... prefixes
    const prefix = filter ? `${filter}:` : ''

    // nothing typed: users, tasks and versions of the entity taking turns, each in its own order
    if (!text) {
      return interleave(
        getMentionOptions('@', { '@': () => users }, prefix || undefined),
        getMentionOptions('@@@', { '@@@': () => tasks }, prefix || undefined),
        getMentionOptions('@@', { '@@': () => versions }, prefix || undefined),
      ).filter(isMentionItem)
    }

    // best matches first, whatever the type. With a project search, loose fuzzy matches would
    // push its results out, so only real matches (down to acronyms) are kept.
    return getMentionOptions(
      '@',
      { '@': () => [...users, ...tasks, ...versions] },
      prefix + text,
      search ? rankings.ACRONYM : undefined,
    ).filter(isMentionItem)
  },
})

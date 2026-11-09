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
  // version mentions are not available on folders, unless the project can be searched
  entityType?: string
  // search beyond the suggestions, see `useProjectMentionSearch`
  search?: MentionSource['search']
}

/**
 * Mention source backed by the activity feed's mention suggestions (`useGetEntityMentionsQuery`),
 * using the same option builders and sorting as the legacy comment input.
 */
export const createFeedMentionSource = ({
  suggestions = {},
  // version options read the product types
  project = { productTypes: [] },
  taskTypes = [],
  entityType,
  search,
}: FeedMentionSourceOptions): MentionSource => ({
  search,
  // users and teams are all in the suggestions already
  searchTriggers: ['@@', '@@@'],
  // the project search also finds folders
  config: search
    ? {
        '@@@': {
          title: '@@@ Tasks & Folders',
          noun: 'item',
          filters: [
            { id: 'task', icon: 'check_circle', tooltip: 'Filter tasks' },
            { id: 'folder', icon: 'folder', tooltip: 'Filter folders' },
          ],
        },
      }
    : undefined,
  getOptions: ({ trigger, search, filter }) => {
    const options = getMentionOptions(
      trigger,
      {
        '@': () => getMentionUsers(suggestions.users, suggestions.teams),
        '@@': () => getMentionVersions(suggestions.versions, project as ProjectContextValue),
        '@@@': () => getMentionTasks(suggestions.tasks, taskTypes),
      },
      // the helper understands `team:` / `user:` prefixes
      (filter ? `${filter}:` : '') + search || undefined,
    ) as (MentionItem | null)[]

    return options.filter((option): option is MentionItem => !!option)
  },
  getError: (trigger) =>
    trigger === '@@' && entityType === 'folder' && !search
      ? 'Version mentions are disabled for folders'
      : null,
})

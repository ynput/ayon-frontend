import { useCallback } from 'react'
import { matchSorter, rankings } from 'match-sorter'
import { useLazySearchMentionEntitiesQuery, type MentionSearchType } from '@shared/api'
import { getEntityTypeIcon } from '@shared/util'
import { getFuzzyDate } from '@shared/containers/Feed/components/ActivityDateHelpers'
import type { MentionItem, MentionQuery, MentionSource } from '../types'

// search results shown at once
const SEARCH_LIMIT = 5

interface TypeIcon {
  name: string
  icon?: string | null
  color?: string | null
}

export interface ProjectMentionSearchOptions {
  projectName?: string
  folderTypes?: TypeIcon[]
  taskTypes?: TypeIcon[]
  productTypes?: TypeIcon[]
}

// the end of a folder path, enough to tell same-named entities apart
const shortPath = (path = '', segments = 2) =>
  path.split('/').filter(Boolean).slice(-segments).join('/')

const parentPath = (path = '') => path.split('/').filter(Boolean).slice(0, -1).join('/')

// the entity types each trigger searches, a picker filter narrows them down
const getSearchTypes = ({ trigger, filter }: MentionQuery): MentionSearchType[] => {
  if (trigger === '@@') return ['version']
  if (trigger === '@@@') {
    if (filter === 'task' || filter === 'folder') return [filter]
    return ['task', 'folder']
  }
  return []
}

/**
 * Searches folders, tasks and versions across the whole project for the mention picker,
 * `SEARCH_LIMIT` per type. `sh010/comp` searches for `sh010` and `comp`.
 */
export const useProjectMentionSearch = ({
  projectName,
  folderTypes,
  taskTypes,
  productTypes,
}: ProjectMentionSearchOptions): MentionSource['search'] => {
  const [searchEntities] = useLazySearchMentionEntitiesQuery()

  const search = useCallback(
    async (query: MentionQuery): Promise<MentionItem[]> => {
      const types = getSearchTypes(query)
      if (!projectName || !types.length) return []

      const terms = query.search.split('/').filter(Boolean)
      const result = await searchEntities(
        { projectName, search: terms.join(' '), types, first: SEARCH_LIMIT },
        true,
      ).unwrap()

      const getType = (list: TypeIcon[] | undefined, name: string) =>
        list?.find((type) => type.name === name)

      const items: MentionItem[] = [
        ...result.tasks.map((task) => {
          const taskType = getType(taskTypes, task.taskType)
          return {
            type: 'task',
            id: task.id,
            label: task.label || task.name,
            context: shortPath(task.folder.path),
            icon: taskType?.icon || getEntityTypeIcon('task'),
            color: taskType?.color || undefined,
          }
        }),
        ...result.folders.map((folder) => ({
          type: 'folder',
          id: folder.id,
          label: folder.label || folder.name,
          context: shortPath(parentPath(folder.path)) || undefined,
          icon: getType(folderTypes, folder.folderType)?.icon || getEntityTypeIcon('folder'),
        })),
        ...result.versions.map((version) => ({
          type: 'version',
          id: version.id,
          label: version.name,
          context: `${shortPath(version.product.folder.path, 1)}/${version.product.name}`,
          icon:
            getType(productTypes, version.product.productType)?.icon ||
            getEntityTypeIcon('version'),
          suffix: getFuzzyDate(new Date(version.createdAt)),
        })),
      ]

      // best match of the last term first, keeping the server order otherwise
      const lastTerm = terms[terms.length - 1] ?? ''
      return matchSorter(items, lastTerm, {
        keys: ['label', 'context'],
        threshold: rankings.NO_MATCH,
        baseSort: (a, b) => a.index - b.index,
      }).slice(0, SEARCH_LIMIT)
    },
    [projectName, folderTypes, taskTypes, productTypes, searchEntities],
  )

  return projectName ? search : undefined
}

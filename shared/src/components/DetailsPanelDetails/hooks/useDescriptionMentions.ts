import { useMemo } from 'react'
import { useGetEntityMentionsQuery } from '@shared/api'
import type { SuggestRequest } from '@shared/api'
import {
  createFeedMentionSource,
  useProjectMentionSearch,
  type MentionSource,
} from '@shared/components/MarkdownEditor'
import type { ProjectContextValue } from '@shared/context'
import type { TaskType } from '@shared/containers/ProjectTreeTable/types/project'
import type { FolderType } from '@shared/api'

export interface DescriptionMentionsContext {
  projectName: string
  entityType: string
  entityId: string
  productTypes?: ProjectContextValue['productTypes']
  taskTypes?: TaskType[]
  folderTypes?: FolderType[]
}

/**
 * Users, sibling tasks and versions to mention in a description, the same suggestions as the
 * comments of the entity, plus a search of the whole project. Only fetched while editing.
 */
export const useDescriptionMentions = (
  context: DescriptionMentionsContext | undefined,
  { skip }: { skip?: boolean } = {},
): MentionSource | undefined => {
  const { data: suggestions } = useGetEntityMentionsQuery(
    {
      suggestRequest: {
        entityType: context?.entityType as SuggestRequest['entityType'],
        entityId: context?.entityId || '',
      },
      projectName: context?.projectName || '',
    },
    { skip: skip || !context?.projectName || !context?.entityId },
  )

  const { productTypes, taskTypes, folderTypes } = context ?? {}
  const search = useProjectMentionSearch({
    projectName: skip ? undefined : context?.projectName,
    productTypes,
    taskTypes,
    folderTypes,
  })
  // keep the source stable, a new one resets the highlighted option of the picker
  return useMemo(
    () =>
      context
        ? createFeedMentionSource({
            suggestions,
            project: { productTypes: productTypes ?? [] },
            taskTypes,
            search,
          })
        : undefined,
    [!!context, suggestions, productTypes, taskTypes, search],
  )
}

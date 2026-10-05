import { useMemo } from 'react'
import { useGetEntityMentionsQuery } from '@shared/api'
import type { SuggestRequest } from '@shared/api'
import { createFeedMentionSource, type MentionSource } from '@shared/components/MarkdownEditor'
import type { ProjectContextValue } from '@shared/context/project'
import type { TaskType } from '@shared/containers/ProjectTreeTable/types/project'

export interface DescriptionMentionsContext {
  projectName: string
  entityType: string
  entityId: string
  productTypes?: ProjectContextValue['productTypes']
  taskTypes?: TaskType[]
}

/**
 * Users, sibling tasks and versions to mention in a description, the same suggestions as the
 * comments of the entity. Only fetched while editing.
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

  const { entityType, productTypes, taskTypes } = context ?? {}
  // keep the source stable, a new one resets the highlighted option of the picker
  return useMemo(
    () =>
      context
        ? createFeedMentionSource({
            suggestions,
            project: { productTypes: productTypes ?? [] },
            taskTypes,
            entityType,
          })
        : undefined,
    [!!context, suggestions, productTypes, taskTypes, entityType],
  )
}

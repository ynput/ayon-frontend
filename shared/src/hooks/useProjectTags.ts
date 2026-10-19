import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { getProjectsGraphql, useGetProjectUsedTagsQuery } from '@shared/api'

type ProjectTag = { name: string; color: string }

interface UseProjectTagsProps {
  projectName?: string
  anatomyTags: { name: string; color?: string }[]
  values?: string[]
  // the used tags are only loaded once the tags dropdown opens
  skip?: boolean
}

/**
 * Tags a tags dropdown offers: the anatomy tags with their colours, then the tags already used on
 * the project's entities and the current values.
 */
export const useProjectTags = ({
  projectName,
  anatomyTags,
  values = [],
  skip,
}: UseProjectTagsProps) => {
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const { data: usedTags = [] } = useGetProjectUsedTagsQuery(
    { projectName: projectName || '' },
    { skip: skip || !projectName },
  )

  const valuesKey = JSON.stringify(values)
  const tags = useMemo(() => {
    const result: Record<string, ProjectTag> = {}
    for (const tag of anatomyTags) result[tag.name] = { name: tag.name, color: tag.color || '' }
    for (const name of [...usedTags, ...values]) {
      if (name && !result[name]) result[name] = { name, color: '' }
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anatomyTags, usedTags, valuesKey])

  // offers a tag in the next dropdown right away, before the used tags are loaded again
  const addUsedTags = useCallback(
    (names: string[]) => {
      if (!projectName || names.every((name) => usedTags.includes(name))) return
      dispatch(
        getProjectsGraphql.util.updateQueryData('GetProjectUsedTags', { projectName }, (draft) => {
          for (const name of names) if (!draft.includes(name)) draft.push(name)
        }),
      )
    },
    [dispatch, projectName, usedTags],
  )

  return { tags, addUsedTags }
}

import { useMemo } from 'react'
import { useGetProjectUsedTagsQuery } from '@shared/api'

type ProjectTag = { name: string; color: string }

interface UseProjectTagsProps {
  projectName?: string
  anatomyTags: { name: string; color?: string }[]
  // memoised, the options are worked out again when it changes
  values?: string[]
  // the used tags are only loaded once the tags dropdown opens
  skip?: boolean
}

/**
 * Tags a tags dropdown offers: the anatomy tags with their colours, then the tags already used on
 * the project's entities and the current values. Saved tags are added to the used tags where they
 * are saved (addProjectUsedTags).
 */
export const useProjectTags = ({ projectName, anatomyTags, values, skip }: UseProjectTagsProps) => {
  // currentData, so another project's tags are not offered while this project's load
  const { currentData: usedTags } = useGetProjectUsedTagsQuery(
    { projectName: projectName || '' },
    { skip: skip || !projectName },
  )

  return useMemo(() => {
    const result: Record<string, ProjectTag> = {}
    for (const tag of anatomyTags) result[tag.name] = { name: tag.name, color: tag.color || '' }
    for (const name of [...(usedTags ?? []), ...(values ?? [])]) {
      if (name && !result[name]) result[name] = { name, color: '' }
    }
    return result
  }, [anatomyTags, usedTags, values])
}

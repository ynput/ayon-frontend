import { useMemo } from 'react'
import { useGetVersionsFrameStartQuery } from '@shared/api'
import { getActivityFrameLink } from '@shared/context'

type Props = {
  projectName: string
  entityType: string
  entities: Array<{ id: string; attrib?: { frameStart?: number | null } }>
  activities: any[]
}

const hasFrames = (activity: any) =>
  !!activity.activityData?.annotations?.length || !!getActivityFrameLink(activity)

// frameStart of the version each framed comment was made on, keyed by version id
export const useOriginFrameStarts = ({ projectName, entityType, entities, activities }: Props) => {
  const feedVersions = useMemo<Record<string, number | null>>(
    () =>
      entityType === 'version'
        ? Object.fromEntries(
            entities
              .filter((entity) => entity.attrib)
              .map((entity) => [entity.id, entity.attrib?.frameStart ?? null]),
          )
        : {},
    [entityType, entities],
  )

  const versionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const activity of activities) {
      const origin = activity.origin
      if (activity.activityType !== 'comment' || origin?.type !== 'version') continue
      if (origin.id in feedVersions || !hasFrames(activity)) continue
      ids.add(origin.id)
    }
    return [...ids].sort()
  }, [activities, feedVersions])

  const { data: fetchedVersions } = useGetVersionsFrameStartQuery(
    { projectName, versionIds },
    { skip: !projectName || !versionIds.length },
  )

  return useMemo(() => ({ ...fetchedVersions, ...feedVersions }), [fetchedVersions, feedVersions])
}

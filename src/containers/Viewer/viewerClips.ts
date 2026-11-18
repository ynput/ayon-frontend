import { clipWithReviewable, versionToClip } from '@ynput/ayon-player/utils'
import type { Clip } from '@ynput/ayon-player/model'
import type {
  DetailsPanelEntityData,
  GetReviewablesResponse,
  ReviewableModel,
  VersionReviewablesModel,
} from '@shared/api'

const PLAYABLE = ['ready', 'conversionRecommended']

export const isPlayable = (reviewable: { availability?: string | null }) =>
  PLAYABLE.includes(reviewable.availability || '')

const toNumber = (value: unknown) => (typeof value === 'number' ? value : undefined)

/**
 * The player clip for one version: its playable reviewables, showing `reviewableId` when it is
 * one of them, else the first. Null when the version has nothing playable. `details` (the
 * version's details panel data) adds the folder and task, which the reviewables response lacks
 * and the header and the comparison picker need.
 */
export const versionClip = (
  projectName: string,
  version: GetReviewablesResponse,
  position: number,
  reviewableId?: string,
  details?: DetailsPanelEntityData,
): Clip | null => {
  const reviewables = (version.reviewables ?? []).filter(isPlayable) as ReviewableModel[]
  const base = versionToClip(projectName)(
    { ...version, reviewables } as VersionReviewablesModel,
    position,
  )
  if (!base) return null

  const chosen = reviewables.find((r) => r.fileId === reviewableId)
  const clip = chosen ? clipWithReviewable(projectName)(base, chosen) : base
  const { folder, task } = details ?? {}

  return {
    ...clip,
    // unique within the viewer: the same version can't be in it twice at one position
    listItemId: `${position}:${version.id}`,
    frameStart: toNumber(version.attrib?.frameStart),
    frameEnd: toNumber(version.attrib?.frameEnd),
    context: {
      ...clip.context,
      productFolderId: folder?.id ?? '',
      path: folder?.path ?? '',
      taskId: task?.id,
      taskName: task?.name,
      taskType: task?.taskType,
    },
  }
}

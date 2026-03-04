import type { ReviewableResponse } from '@shared/api'

export const getGroupedReviewables = (
  reviewables: ReviewableResponse[],
  hasTranscoder?: boolean | undefined,
) => {
  // create a list of reviewables that are actually viewable
  const readyReviewables = reviewables.filter(
    (reviewable) =>
      (reviewable.availability === 'ready' ||
        reviewable.availability === 'conversionRecommended') &&
      !reviewable.processing,
  )
  const notReadyReviewables = reviewables.filter(
    (reviewable) =>
      reviewable.availability !== 'ready' && reviewable.availability !== 'conversionRecommended',
  )

  // reviewables that will never be converted:
  // 1: no converted pairing (another reviewable with the same activityId)
  // 2: no processing (because they do not have transcoding installed)
  const neverConvertedReviewables = notReadyReviewables.filter(
    (reviewable) =>
      !readyReviewables.find((r) => r.activityId === reviewable.activityId) &&
      (!reviewable.processing || !hasTranscoder),
  )

  // reviewables that cannot be played and will never be converted
  const incompatibleReviewables = neverConvertedReviewables.filter(
    (reviewable) => reviewable.availability === 'conversionRequired',
  )

  // reviewables that are/will be converted and not already converted
  const convertingReviewables = notReadyReviewables.filter(
    (reviewable) =>
      reviewable.processing &&
      !readyReviewables.find((r) => r.activityId === reviewable.activityId) &&
      hasTranscoder,
  )
  // find any reviewables that are currently being converted
  const processingReviewables = convertingReviewables.filter(
    (reviewable) => reviewable.processing?.eventId,
  )
  // find any reviewables that are queued for processing
  const queuedReviewables = convertingReviewables.filter(
    (reviewable) => !reviewable.processing?.eventId,
  )

  const unplayableQueuedReviewables = queuedReviewables.filter(
    (reviewable) => reviewable.availability === 'conversionRequired',
  )

  return {
    playable: readyReviewables,
    incompatible: incompatibleReviewables,
    processing: processingReviewables,
    queued: unplayableQueuedReviewables,
  }
}

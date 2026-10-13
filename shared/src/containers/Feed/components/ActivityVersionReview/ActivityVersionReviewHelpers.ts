import { VersionReviewFeedback } from '../CommentInput/types'

export const getVerbForFeedback = (feedback: VersionReviewFeedback) => {
  switch (feedback) {
    case VersionReviewFeedback.REQUEST_CHANGES:
      return 'requested changes'
    case VersionReviewFeedback.APPROVE:
    default:
      return 'approved this'
  }
}
export const getVerbForFeedbackBody = (feedback: VersionReviewFeedback, entityType: string) => {
  switch (feedback) {
    case VersionReviewFeedback.REQUEST_CHANGES:
      return 'Requested changes on ' + entityType
    case VersionReviewFeedback.APPROVE:
    default:
      return 'Approved ' + entityType
  }
}

export const getIconForFeedback = (feedback: VersionReviewFeedback) => {
  switch (feedback) {
    case VersionReviewFeedback.REQUEST_CHANGES:
      return 'refresh'
    case VersionReviewFeedback.APPROVE:
    default:
      return 'task_alt'
  }
}

export enum VersionReviewFeedback {
  APPROVE = 'approve',
  REQUEST_CHANGES = 'request_changes',
}

export { mentionTypeOptions } from '@shared/util/mentionTypeOptions'

// a comment copied into the new comment input to adapt and post (comment menu > Duplicate)
export interface CommentDuplicate {
  // new for every duplicate, so the same comment can be duplicated again
  key: string
  activity: {
    activityId: string
    body?: string
    entityId?: string
    entityType?: string
    origin?: { id: string; type: string }
    // as shown in the feed: annotation composites carry their annotation, layers are left out
    files?: { id: string; name: string; mime?: string; annotation?: any }[]
  }
}

export enum VersionReviewFeedback {
  APPROVE = 'approve',
  REQUEST_CHANGES = 'request_changes',
}

export const mentionTypeOptions = {
  '@@@': {
    id: 'task',
  },
  '@@': {
    id: 'version',
  },
  '@': {
    id: 'user',
    isCircle: true,
  },
}

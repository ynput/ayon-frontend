import { useMemo } from 'react'
import { createFeedMentionSource } from '@shared/components/MarkdownEditor'
import { MOCK_PROJECT, MOCK_SUGGESTIONS, MOCK_TASK_TYPES } from './samples'

// mention source with mock users, teams, versions and tasks
export const useMockMentions = (isFolder = false) =>
  useMemo(
    () =>
      createFeedMentionSource({
        suggestions: MOCK_SUGGESTIONS,
        project: MOCK_PROJECT as any,
        taskTypes: MOCK_TASK_TYPES as any,
        entityType: isFolder ? 'folder' : 'task',
      }),
    [isFolder],
  )

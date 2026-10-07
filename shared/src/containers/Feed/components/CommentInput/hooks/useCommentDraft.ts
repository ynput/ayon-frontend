import { useEffect, useRef } from 'react'
import { SavedAnnotationMetadata } from '../../../index'

// Drafts of new comments are kept in localStorage per project, user and entities,
// so they survive a reload, a closed tab or the comment input unmounting.
// Unsaved annotations are backed up by the host (e.g. the player), not here.

const PREFIX = 'ayon-comment-draft/'
// older drafts are dropped instead of restored
const MAX_AGE = 30 * 24 * 60 * 60 * 1000

export type CommentDraft = {
  text: string
  // already uploaded attachments and image / video blocks
  files: any[]
  // annotations of a duplicated comment, already uploaded
  uploadedAnnotations: SavedAnnotationMetadata[]
  category: string | null
}

type StoredDraft = CommentDraft & { savedAt: number }

const isEmpty = (draft: CommentDraft) =>
  !draft.text.trim() && !draft.files.length && !draft.uploadedAnnotations.length

// storage can be unavailable (private mode, blocked site data) or full
const read = (key: string): StoredDraft | null => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const write = (key: string, draft: CommentDraft) => {
  try {
    if (isEmpty(draft)) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }))
  } catch (error) {
    console.warn('Could not save comment draft', error)
  }
}

const removeExpired = () => {
  try {
    const now = Date.now()
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(PREFIX)) continue
      const draft = read(key)
      if (!draft || now - draft.savedAt > MAX_AGE) localStorage.removeItem(key)
    }
  } catch {
    // nothing to clean up
  }
}

export const getCommentDraftKey = (
  projectName: string,
  userName: string | undefined,
  entityIds: string[],
) =>
  projectName && userName && entityIds.length
    ? `${PREFIX}${projectName}/${userName}/${[...entityIds].sort().join(',')}`
    : null

type Props = {
  // null when drafts are off or the comment has no target yet
  draftKey: string | null
  draft: CommentDraft
  // don't save while submitting, the input is cleared before the comment is saved
  paused: boolean
  restore: (draft: CommentDraft) => void
}

const useCommentDraft = ({ draftKey, draft, paused, restore }: Props) => {
  // the key whose draft the input currently shows
  const shownKey = useRef<string | null>(null)
  // until the restored draft renders, the state still belongs to the previous key
  const restoring = useRef(false)

  // restore the draft of these entities, or start empty when switching to entities without one
  useEffect(() => {
    if (!draftKey || paused) return
    const previousKey = shownKey.current
    shownKey.current = draftKey
    if (previousKey === draftKey) return

    if (!previousKey) removeExpired()
    const stored = read(draftKey)
    if (stored && Date.now() - stored.savedAt <= MAX_AGE) {
      restoring.current = true
      restore({
        text: stored.text ?? '',
        files: stored.files ?? [],
        uploadedAnnotations: stored.uploadedAnnotations ?? [],
        category: stored.category ?? null,
      })
    } else if (previousKey) {
      // the previous entities' text is saved under their own key
      restoring.current = true
      restore({ text: '', files: [], uploadedAnnotations: [], category: draft.category })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, paused])

  useEffect(() => {
    if (restoring.current) {
      restoring.current = false
      return
    }
    if (!draftKey || paused) return
    write(draftKey, draft)
  }, [draftKey, paused, draft.text, draft.files, draft.uploadedAnnotations, draft.category])
}

export default useCommentDraft

import { useState, useEffect, useMemo } from 'react'
import { Quill } from 'react-quill-ayon'
import getMentionOptions from '@shared/containers/Feed/mentionHelpers/getMentionOptions'
import getMentionUsers from '@shared/containers/Feed/mentionHelpers/getMentionUsers'
import getMentionVersions from '@shared/containers/Feed/mentionHelpers/getMentionVersions'
import getMentionTasks from '@shared/containers/Feed/mentionHelpers/getMentionTasks'
import { useFeedContext } from '@shared/containers/Feed/context/FeedContext'
import useMentionLink from '@shared/containers/Feed/components/CommentInput/hooks/useMentionLink'

var Delta = Quill.import('delta')

const mentionTypes = ['@', '@@', '@@@']
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

interface UseMentionSystemProps {
  editorRef: React.RefObject<any>
  isEditing: boolean
  setEditorValue: (value: string) => void
}

export const useMentionSystem = ({
  editorRef,
  isEditing,
  setEditorValue,
}: UseMentionSystemProps) => {
  let feedContext = null
  try {
    feedContext = useFeedContext()
  } catch (error) {
    // Feed context is not available, mentions will be disabled
  }

  const { projectName, projectInfo, mentionSuggestionsData } = feedContext || {}
  const {
    users: mentionUsers,
    versions: mentionVersions,
    tasks: mentionTasks,
  } = mentionSuggestionsData || {}

  const [mention, setMention] = useState<null | any>(null)
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)

  // Sort mention types by length (longest first) for proper matching
  const sortedMentionTypes = mentionTypes.toSorted((a, b) => b.length - a.length)

  const mentionOptions = useMemo(() => {
    if (!feedContext || !mentionUsers || !mentionVersions || !mentionTasks) {
      return []
    }

    return getMentionOptions(
      mention?.type,
      {
        '@': () => getMentionUsers(mentionUsers),
        '@@': () => getMentionVersions(mentionVersions),
        '@@@': () => getMentionTasks(mentionTasks, projectInfo?.taskTypes),
      },
      mention?.search,
    )
  }, [
    feedContext,
    mentionTasks,
    mentionVersions,
    mentionUsers,
    mention?.type,
    mention?.search,
    projectInfo?.taskTypes,
  ])

  const shownMentionOptions = mentionOptions.slice(0, 5)

  useMentionLink({ projectName: projectName ?? '' })

  // Reset mention state when editing stops
  useEffect(() => {
    if (!isEditing) {
      setMention(null)
      setMentionSelectedIndex(0)
    }
  }, [isEditing])

  const handleSelectMention = (selectedOption: any) => {
    const quill = editorRef.current?.getEditor()

    if (!quill || !mention) {
      return
    }

    const typePrefix = mention.type
    const search = typePrefix + (mention.search || '')
    const mentionLabel = typePrefix + selectedOption.label
    const type = mentionTypeOptions[typePrefix as keyof typeof mentionTypeOptions]
    const href = `${type?.id}:${selectedOption.id}`

    const selection = quill.getSelection(true)
    const selectionIndex = selection?.index || 0
    const startIndex = selectionIndex - search.length

    quill.deleteText(startIndex, search.length)

    quill.insertText(startIndex, mentionLabel, 'mention', href)

    const endIndex = startIndex + mentionLabel.length

    quill.updateContents(new Delta().retain(endIndex).insert(' '))

    quill.updateContents(new Delta().retain(endIndex + 1).delete(1))

    quill.setSelection(endIndex + 1)

    setMention(null)
    setMentionSelectedIndex(0)
  }

  const addTextToEditor = (type: string) => {
    const quill = editorRef.current?.getEditor()

    if (!quill) return

    let retain = quill.getSelection(true)?.index || 0

    const currentCharacter = quill.getText(retain - 1, 1)

    const addSpace = currentCharacter !== ' ' && currentCharacter
    if (addSpace) {
      quill.insertText(retain, ' ')
      retain++
    }

    quill.insertText(retain, type)
  }

  const handleMentionButton = (type: string) => {
    if (mention) {
      const { type, retain, search = '' } = mention

      const quill = editorRef.current?.getEditor()
      if (!quill) return

      const length = type.length + search.length
      const start = retain - type.length + 1
      quill.deleteText(start, length)
    }

    addTextToEditor(type)
  }

  const handleMentionKeyDown = (e: React.KeyboardEvent) => {
    if (mention) {
      if (e.key === 'Escape') {
        setMention(null)
        setMentionSelectedIndex(0)
        return
      }

      const arrowDirection = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0

      if (arrowDirection) {
        // navigate through mentions
        e.preventDefault()
        let newIndex = mentionSelectedIndex + arrowDirection
        if (newIndex < 0) newIndex = shownMentionOptions.length - 1
        if (newIndex >= shownMentionOptions.length) newIndex = 0
        setMentionSelectedIndex(newIndex)
      }
    }
  }

  const handleMentionChange = (content: string, delta: any, _: any, editor: any) => {
    if (!editor || !editorRef.current) {
      setEditorValue(content)
      return
    }

    let currentCharacter =
      (delta.ops[0] && delta.ops[0].insert) || (delta.ops[1] && delta.ops[1].insert)

    const tabOrEnter = currentCharacter === '\n' || currentCharacter === '\t'
    const selectedOption = mentionOptions[mentionSelectedIndex]

    if (mention && tabOrEnter && selectedOption) {
      handleSelectMention(selectedOption)

      return
    }

    setEditorValue(content)

    const isDelete = delta.ops.length === 2 && !!delta.ops[1].delete

    if (!currentCharacter && isDelete) {
      currentCharacter = editor.getText(delta.ops[0].retain - 1, 1)
    }

    const isMention = currentCharacter && sortedMentionTypes.includes(currentCharacter)

    if (isMention) {
      const mentionIndex = delta.ops.findIndex((op: any) => 'insert' in op || 'delete' in op)
      const mentionChar = currentCharacter
      let retain = mentionIndex === 0 ? 0 : delta.ops[mentionIndex - 1].retain
      if (isDelete) retain = retain - 1

      const textBefore = editor.getText(0, retain)
      const isAtStartOfLine = retain === 0
      const isAfterSpace = textBefore.endsWith(' ')
      const isAtStartOfWord = isAtStartOfLine || isAfterSpace

      if (!isAtStartOfWord) {
        setMention(null)
        setMentionSelectedIndex(0)
        return
      }

      let mentionMatch = null

      for (const chars of sortedMentionTypes) {
        let isMatch = true
        if (chars.endsWith(mentionChar)) {
          for (let i = chars.length - 1; i >= 0; i--) {
            if (i === 0) continue
            const char = chars[i - 1]
            const indexInDelta = retain - (chars.length - i)
            const valueCharAtIndex = editor.getText(indexInDelta, 1)
            if (valueCharAtIndex !== char) {
              isMatch = false
              break
            }
          }
        } else {
          isMatch = false
        }

        if (isMatch) {
          mentionMatch = chars
          break
        }
      }

      if (mentionMatch) {
        setMention({
          type: mentionMatch,
          retain: retain,
        })
      } else {
        setMention(null)
        setMentionSelectedIndex(0)
      }
    } else {
      if (mention) {
        const retain = delta.ops[0].retain
        if (
          currentCharacter === ' ' ||
          !retain ||
          !currentCharacter ||
          !sortedMentionTypes.includes(currentCharacter)
        ) {
          setMention(null)
          setMentionSelectedIndex(0)
          return
        }

        let distanceMentionToRetain = retain - mention.retain
        if (!isDelete) distanceMentionToRetain++
        const mentionFull = editor.getText(mention.retain, distanceMentionToRetain)
        const mentionSearch = mentionFull.replace(mention.type.slice(-1), '')
        //  check for space in mentionFull
        if (mentionFull.includes(' ')) {
          setMention(null)
          setMentionSelectedIndex(0)
        } else {
          setMention({
            ...mention,
            search: mentionSearch?.toLowerCase(),
          })
        }
      } else {
        const quill = editorRef.current?.getEditor()
        if (quill) {
          const currentSelection = quill.getSelection(false)
          const currentFormat = quill.getFormat(currentSelection?.index, currentSelection?.length)
          if (currentFormat.mention) {
            const [lineBlock] = quill.getLine(currentSelection.index - 1) || []
            const ops = lineBlock?.cache?.delta?.ops || []
            const lastMentionOp = ops.reverse().find((op: any) => op.attributes?.mention)
            if (lastMentionOp) {
              const mentionLength = lastMentionOp.insert.length
              quill.deleteText(currentSelection.index - mentionLength, mentionLength)
            }
          }
        }
      }
    }
  }

  return {
    feedContext,
    projectName,
    mention,
    mentionSelectedIndex,
    mentionOptions: shownMentionOptions,
    mentionTypes: sortedMentionTypes,
    mentionTypeOptions,
    handleSelectMention,
    handleMentionButton,
    handleMentionKeyDown,
    handleMentionChange,
  }
}

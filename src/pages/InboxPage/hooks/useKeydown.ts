import { useState, RefObject, KeyboardEvent, Dispatch, SetStateAction } from 'react'
import type { GroupedMessage, SelectModifiers } from '../types'

interface UseKeydownProps {
  messages: GroupedMessage[]
  onChange: (id: string, ids?: string[], modifiers?: SelectModifiers, rowIndex?: number) => void
  selected: string[]
  listRef: RefObject<HTMLUListElement | null>
}

type UseKeydownReturn = [(e: KeyboardEvent) => void, [boolean, Dispatch<SetStateAction<boolean>>]]

const MESSAGE_ID_PREFIX = 'message-'

const useKeydown = ({
  messages,
  onChange,
  selected,
  listRef,
}: UseKeydownProps): UseKeydownReturn => {
  // is the user using the keyboard for navigation
  const [usingKeyboard, setUsingKeyboard] = useState(false)

  // the moving cursor is the focused row, so mouse and keyboard stay in sync;
  // fall back to the first selected row when nothing is focused
  const getCurrentIndex = (): number => {
    const active = listRef.current?.ownerDocument?.activeElement as HTMLElement | null
    const elId = active?.id || ''
    if (elId.startsWith(MESSAGE_ID_PREFIX)) {
      const id = elId.slice(MESSAGE_ID_PREFIX.length)
      const idx = messages.findIndex((m) => m.activityId === id)
      if (idx >= 0) return idx
    }
    return messages.findIndex((m) => selected.includes(m.activityId))
  }

  const handleKeyDown = (e: KeyboardEvent): void => {
    // if there are no messages, do nothing
    if (!messages.length) return
    const key = e.key

    // if the user is using the keyboard, set the state
    const isUsingKeyboard = ['ArrowDown', 'ArrowUp', 'Tab'].includes(key)
    if (isUsingKeyboard) setUsingKeyboard(true)

    // shift + arrow extends the selection; Tab keeps its own shift behaviour
    const isShiftRange = e.shiftKey && (key === 'ArrowDown' || key === 'ArrowUp')

    const currentIndex = getCurrentIndex()

    let targetIndex: number | null = null
    if (key === 'ArrowDown' || (key === 'Tab' && !e.shiftKey)) {
      const nextIndex = currentIndex + 1
      // out of bounds: let the browser move focus to the next element
      if (nextIndex >= messages.length) return
      e.preventDefault()
      targetIndex = nextIndex
    } else if (key === 'ArrowUp' || (key === 'Tab' && e.shiftKey)) {
      const previousIndex = currentIndex - 1
      // out of bounds: let the browser move focus to the previous element
      if (previousIndex < 0) return
      e.preventDefault()
      targetIndex = previousIndex
    }

    if (targetIndex === null) return

    const target = messages[targetIndex]
    onChange(target.activityId, undefined, isShiftRange ? { shiftKey: true } : undefined, targetIndex)

    // move focus to the target row so the next key continues from here
    const listEl = listRef.current?.querySelector(
      `#${MESSAGE_ID_PREFIX}${target.activityId}`,
    ) as HTMLElement | null
    if (listEl) listEl.focus()
  }

  return [handleKeyDown, [usingKeyboard, setUsingKeyboard]] as UseKeydownReturn
}

export default useKeydown

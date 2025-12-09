import { useState, RefObject, KeyboardEvent, Dispatch, SetStateAction } from 'react'
import type { GroupedMessage } from '../types'

interface UseKeydownProps {
  messages: GroupedMessage[]
  onChange: (id: string, ids?: string[]) => void
  selected: string[]
  listRef: RefObject<HTMLUListElement | null>
}

type UseKeydownReturn = [(e: KeyboardEvent) => void, [boolean, Dispatch<SetStateAction<boolean>>]]

const useKeydown = ({
  messages,
  onChange,
  selected,
  listRef,
}: UseKeydownProps): UseKeydownReturn => {
  // is the user using the keyboard for navigation
  const [usingKeyboard, setUsingKeyboard] = useState(false)

  const handleKeyDown = (e: KeyboardEvent): void => {
    // if there are no messages, do nothing
    if (!messages.length) return
    const key = e.key

    // if the user is using the keyboard, set the state
    const isUsingKeyboard = ['ArrowDown', 'ArrowUp', 'Tab'].includes(key)
    if (isUsingKeyboard) setUsingKeyboard(true)

    let newSelected: string | null = null
    // if arrow down, select next task
    // if arrow down, select next task
    if (key === 'ArrowDown' || (key === 'Tab' && !e.shiftKey)) {
      // move to the next task
      const currentIndex = messages.findIndex((m) => selected.includes(m.activityId))
      const nextIndex = currentIndex + 1
      // if the next index is out of bounds, do nothing
      if (nextIndex >= messages.length) {
        if (key === 'Tab') {
          // clear selected - signal with empty string
          newSelected = ''
        }
        // not calling preventDefault here will allow the browser to focus the next element
        return
      }
      e.preventDefault()
      newSelected = messages[nextIndex].activityId
    }

    // if arrow up, select previous task
    if (key === 'ArrowUp' || (key === 'Tab' && e.shiftKey)) {
      // move to the previous task
      const currentIndex = messages.findIndex((m) => selected.includes(m.activityId))
      const previousIndex = currentIndex - 1
      // if the previous index is out of bounds, do nothing
      if (previousIndex < 0) {
        if (key === 'Tab') {
          // clear selected - signal with empty string
          newSelected = ''
        }
        // not calling preventDefault here will allow the browser to focus the previous element
        return
      }

      newSelected = messages[previousIndex].activityId
    }

    e.preventDefault()
    // update selected
    if (newSelected) {
      onChange(newSelected)

      // set new focus to the selected task
      const listEl = listRef.current?.querySelector(`#message-${newSelected}`) as HTMLElement | null
      if (listEl) listEl.focus()
    }
  }

  return [handleKeyDown, [usingKeyboard, setUsingKeyboard]] as UseKeydownReturn
}

export default useKeydown

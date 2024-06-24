import { useState } from 'react'

const useKeydown = ({ messages, onChange, selected, listRef }) => {
  // is the user using the keyboard for navigation
  const [usingKeyboard, setUsingKeyboard] = useState(false)

  const handleKeyDown = (e) => {
    // if there are no messages, do nothing
    if (!messages.length) return
    const key = e.key

    // if the user is using the keyboard, set the state
    const isUsingKeyboard = ['ArrowDown', 'ArrowUp', 'Tab'].includes(key)
    if (isUsingKeyboard) setUsingKeyboard(true)

    let newSelected = null
    // if arrow down, select next task
    // if arrow down, select next task
    if (key === 'ArrowDown' || (key === 'Tab' && !e.shiftKey)) {
      // move to the next task
      const currentIndex = messages.findIndex((m) => selected.includes(m.activityId))
      const nextIndex = currentIndex + 1
      // if the next index is out of bounds, do nothing
      if (nextIndex >= messages.length) {
        if (key === 'Tab') {
          // clear selected
          onChange([])
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
          // clear selected
          onChange([])
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
      const listEl = listRef.current?.querySelector(`#message-${newSelected}`)
      if (listEl) listEl.focus()
    }
  }

  return [handleKeyDown, [usingKeyboard, setUsingKeyboard]]
}

export default useKeydown

import { DropdownRef } from '@ynput/ayon-react-components'
import { useEffect, useRef, useState } from 'react'

const useDropdownPlaceholderState = (origValue: string[], updateHandler: (e: string[]) => void) => {
  const [value, setValue] = useState(origValue)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const ref = useRef<DropdownRef>(null)

  const expandClickHandler = () => {
    setShowPlaceholder(false)
  }

  const changeHandler = (e: string[]) => {
    setShowPlaceholder(true)
    setValue(e)
    updateHandler(e)
  }

  useEffect(() => {
    if (!ref.current) {
      return
    }
    ref.current?.open()
  }, [ref, showPlaceholder])

  return {
    value,
    setValue,
    showPlaceholder,
    setShowPlaceholder,
    expandClickHandler,
    changeHandler,
    ref,
  }
}

export default useDropdownPlaceholderState

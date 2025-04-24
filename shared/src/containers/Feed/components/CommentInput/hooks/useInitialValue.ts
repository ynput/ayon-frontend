import { useEffect, MutableRefObject } from 'react'

interface UseInitialValueProps {
  markdownRef: MutableRefObject<HTMLDivElement | null>
  initValue?: string | null
  setEditorValue: (value: string) => void
  setInitHeight: (height: number) => void
  isOpen: boolean
  filter?: string
}

const useInitialValue = ({
  markdownRef,
  initValue,
  setEditorValue,
  setInitHeight,
  isOpen,
  filter,
}: UseInitialValueProps) => {
  useEffect(() => {
    if (markdownRef.current && initValue) {
      // convert markdown to html
      const html = markdownRef.current.innerHTML
      setEditorValue(html)
      // set html to editor
      // get height of markdown
      const height = markdownRef.current.offsetHeight
      setInitHeight(height)
    } else if (isOpen) {
      // if filter === checklist start with a checklist item
      if (filter === 'checklists') {
        console.log('checklists')
        setEditorValue(`<ul data-checked="false"><li> </li></ul>`)
      } else {
        setEditorValue('')
      }
    }
  }, [initValue, isOpen, markdownRef.current, filter, setEditorValue, setInitHeight])
}

export default useInitialValue

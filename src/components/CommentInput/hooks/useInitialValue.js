import { useEffect } from 'react'

const useInitialValue = ({
  markdownRef,
  initValue,
  setEditorValue,
  setInitHeight,
  isOpen,
  filter,
}) => {
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
  }, [initValue, isOpen, markdownRef.current, filter])
}

export default useInitialValue

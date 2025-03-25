import { useEffect } from 'react'

const useSetCursorEnd = ({ initHeight, editorRef, isEditing }) => {
  // When editing, set selection to the end of the editor
  useEffect(() => {
    if (initHeight && editorRef.current && isEditing) {
      const editor = editorRef.current.getEditor()
      if (!editor) return
      const length = editor.getLength()
      if (length < 2) return
      editor.setSelection(length)
    }
  }, [initHeight, editorRef.current, isEditing])
}

export default useSetCursorEnd

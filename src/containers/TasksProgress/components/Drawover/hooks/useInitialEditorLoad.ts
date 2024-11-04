import { useEffect } from 'react'
import { Editor } from 'tldraw'

type Props = {
  editor: Editor | null
  isOpen: { id: string; value?: string } | null
  handleToolClick: (isOpen: { id: string; value?: string }) => void
}

const useInitialEditorLoad = ({ editor, isOpen, handleToolClick }: Props) => {
  useEffect(() => {
    if (!editor || !isOpen) return
    handleToolClick(isOpen)

    const pages = editor.getPages()
    // delete all pages that do not have meta.type === frame
    pages.forEach((page) => {
      if (page.meta.type !== 'frame') {
        editor.deletePage(page.id)
      }
    })
  }, [editor, isOpen])
}

export default useInitialEditorLoad

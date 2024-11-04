import { useEffect } from 'react'
import { Editor } from 'tldraw'

type Props = {
  editor: Editor | null
  isPlaying: boolean
}

const usePlayingState = ({ editor, isPlaying }: Props) => {
  // setReadOnly when isPlaying is true
  useEffect(() => {
    if (editor) {
      editor.updateInstanceState({ isReadonly: isPlaying })
      if (isPlaying) {
        editor.selectNone()
      }
    }
  }, [isPlaying, editor])
}

export default usePlayingState

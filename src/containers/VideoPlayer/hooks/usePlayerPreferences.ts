import { useLocalStorage } from '@shared/hooks'

const usePlayerPreferences = () => {
  const [showOverlay, setShowOverlay] = useLocalStorage('videoPlayer-showOverlay', false)
  const [loop, setLoop] = useLocalStorage('videoPlayer-loop', true)
  const [muted, setMuted] = useLocalStorage('videoPlayer-muted', false)

  return { showOverlay, setShowOverlay, loop, setLoop, muted, setMuted }
}

export default usePlayerPreferences

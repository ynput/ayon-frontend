import { useSessionStorage } from '@shared/hooks'

const usePlayerPreferences = () => {
  const [showOverlay, setShowOverlay] = useSessionStorage('videoPlayer-showOverlay', false)
  const [loop, setLoop] = useSessionStorage('videoPlayer-loop', true)
  const [muted, setMuted] = useSessionStorage('videoPlayer-muted', false)

  return { showOverlay, setShowOverlay, loop, setLoop, muted, setMuted }
}

export default usePlayerPreferences

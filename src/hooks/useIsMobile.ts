import { useSyncExternalStore } from 'react'
import { MOBILE_MEDIA_QUERY } from '@shared/util/breakpoints'

export { MOBILE_MEDIA_QUERY }

const subscribe = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(MOBILE_MEDIA_QUERY).matches

const getServerSnapshot = () => false

export const useIsMobile = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

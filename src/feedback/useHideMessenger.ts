import { useEffect } from 'react'
import { useFeedback } from './FeedbackContext'
import { useLocation } from 'react-router-dom'
import { useAppSelector } from '@state/store'

const pathsToHide = ['/projects/*/reviews/*', '/projects/*/addon/*']

// Utility function to check if the current path matches any of the paths to hide
const doesPathMatch = (pathname: string) => {
  return pathsToHide.some((path) => {
    // Replace wildcard with regex
    const regexPath = path.replaceAll('*', '.*')
    const regex = new RegExp(`^${regexPath}$`)
    return regex.test(pathname)
  })
}

// defines which paths should hide the messenger platform
const useHideMessenger = () => {
  const { pathname } = useLocation()
  const { setMessengerVisibility } = useFeedback()
  const pathMatches = doesPathMatch(pathname)
  const viewer = useAppSelector((state) => state.viewer)
  // if the viewer is open, hide the messenger
  const viewerOpen = viewer.isOpen

  const shouldHide = pathMatches || viewerOpen

  useEffect(() => {
    // Show or hide the messenger based on path match
    setMessengerVisibility(!shouldHide)
  }, [shouldHide, setMessengerVisibility])
}

export default useHideMessenger

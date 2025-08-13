import { useSelector } from 'react-redux'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { formatTitle } from '../utils/formatTitle'


/**
 * Hook to format page titles based on breadcrumb title
 * @param breadcrumbTitle - The breadcrumb title string (e.g., "Project / Browser / Overview")
 * @returns Formatted title string for document.title
 */
const useTitle = (breadcrumbTitle: string): string => {
  const projectName = useSelector((state: any) => state.project.name)
  const location = useLocation()

  return useMemo(() => {
    // Split breadcrumb title into parts
    const breadcrumbParts = breadcrumbTitle ? breadcrumbTitle.split(' / ') : []

    // Call pure function with all necessary data
    return formatTitle(breadcrumbParts, projectName, location.pathname)
  }, [breadcrumbTitle, projectName, location.pathname])
}

export default useTitle

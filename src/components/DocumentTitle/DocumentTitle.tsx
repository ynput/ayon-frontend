import React from 'react'
import { Helmet } from 'react-helmet'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { formatTitle } from '@/utils/formatTitle'

interface Link {
  name: string
  path: string
  module: string
}

interface DocumentTitleProps {
  title?: string
  links?: Link[]
}

/**
 * Component responsible for setting the document title
 * @param title - Simple title string (e.g., "Market")
 * @param links - Array of navigation links to determine current page title
 */
const DocumentTitle: React.FC<DocumentTitleProps> = ({ title, links }) => {
  const projectName = useSelector((state: any) => state.project.name) as string | undefined
  const location = useLocation()

  const formattedTitle = React.useMemo(() => {
    let pageTitle = title

    // If links provided, find current page from links
    if (links && !title) {
      const currentLink = links.find(link => link.path === location.pathname)
      pageTitle = currentLink?.name
    }

    if (!pageTitle) return 'AYON'

    // Use simple formatting logic
    const breadcrumbParts = [pageTitle]
    const finalTitle = formatTitle(breadcrumbParts, projectName, location.pathname)

    // Debug logging
    console.log('DocumentTitle (explicit):', {
      pathname: location.pathname,
      title,
      links: !!links,
      pageTitle,
      projectName,
      finalTitle
    })

    return finalTitle
  }, [title, links, location.pathname, projectName])

  return (
    <Helmet>
      <title>{formattedTitle}</title>
    </Helmet>
  )
}

export default DocumentTitle

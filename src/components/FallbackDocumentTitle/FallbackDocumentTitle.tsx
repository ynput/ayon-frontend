import React from 'react'
import { Helmet } from 'react-helmet'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { formatTitle } from '@/utils/formatTitle'
import { uri2crumbs } from '@/utils/breadcrumbs'

/**
 * Fallback DocumentTitle that provides titles for pages without explicit DocumentTitle
 */
const FallbackDocumentTitle: React.FC = () => {
  const projectName = useSelector((state: any) => state.project.name) as string | undefined
  const ctxUri = useSelector((state: any) => state.context.uri) || ''
  const location = useLocation()

  const fallbackTitle = React.useMemo(() => {
    // Generate breadcrumbs as fallback
    const breadcrumbParts = uri2crumbs(ctxUri, location.pathname)

    if (breadcrumbParts.length === 0) {
      return 'AYON'
    }

    const title = formatTitle(breadcrumbParts, projectName, location.pathname)

    // Debug logging
    console.log('FallbackDocumentTitle:', {
      pathname: location.pathname,
      ctxUri,
      breadcrumbParts,
      projectName,
      finalTitle: title
    })

    return title
  }, [ctxUri, location.pathname, projectName])

  return (
    <Helmet>
      <title>{fallbackTitle}</title>
    </Helmet>
  )
}

export default FallbackDocumentTitle

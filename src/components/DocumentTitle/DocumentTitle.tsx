import React from 'react'
import {Helmet} from 'react-helmet'
import {useSelector} from 'react-redux'
import {useLocation} from 'react-router-dom'
import {formatTitle} from '@/utils/formatTitle'
import {uri2crumbs} from '@/utils/breadcrumbs'

/**
 * Main DocumentTitle component that provides titles for all pages
 */
const DocumentTitle: React.FC = () => {
  const projectName = useSelector((state: any) => state.project.name) as string | undefined
  const ctxUri = useSelector((state: any) => state.context.uri) || ''
  const location = useLocation()

  const fallbackTitle = React.useMemo(() => {
    // Generate breadcrumbs as fallback, including projectName for proper context
    const breadcrumbParts = uri2crumbs(ctxUri, location.pathname, projectName)

    if (breadcrumbParts.length === 0) {
      return 'AYON'
    }

    return formatTitle(breadcrumbParts, projectName, location.pathname)

  }, [ctxUri, location.pathname, projectName])

  return (
    <Helmet defer={false} key={`${location.pathname}-${projectName || 'no-project'}`}>
      <title>{fallbackTitle}</title>
    </Helmet>
  )
}

export default DocumentTitle

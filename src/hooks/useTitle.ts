import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTitleContext } from '@context/TitleContext'
import { upperFirst } from 'lodash'

type LinkLike = Partial<{
  name: string
  module: string
}> & Record<string, any>

type UseTitleOptions = {
  page?: string
  parentPage?: string
  project?: string
  entity?: string
  links?: LinkLike[]
  paramKey?: string // default: 'module'
}

// Fallback logic adapted from breadcrumbs
const getPageFromPathname = (pathname: string): string => {
  const pathParts = pathname.slice(1).split('/').filter(Boolean)

  if (pathParts.length === 0) return 'Dashboard'

  let pageTitle = pathParts[0]

  // Handle special cases like breadcrumbs does
  if (pageTitle.includes('settings')) return 'Studio Settings'
  if (pageTitle.includes('manageProjects')) return 'Projects Manager'
  if (pageTitle === 'dashboard') return 'Dashboard'
  if (pageTitle === 'projects' && pathParts[2]) {
    // For project pages, use the module name
    return upperFirst(pathParts[2])
  }

  // Return capitalized page name
  return upperFirst(pageTitle)
}

const useTitle = (options: UseTitleOptions = {}) => {
  const { setTitleParts } = useTitleContext()
  const { page, project, entity, links, paramKey = 'module', parentPage } = options
  const params = useParams()

  // Auto-resolve page if links are provided, with breadcrumbs fallback
  const resolvedPage = (() => {
    // First try explicit page prop
    if (page) return page

    // Then try links matching
    if (links) {
      const validLinks = links.filter(
          (l): l is { name: string; module: string } =>
              typeof l.name === 'string' && typeof l.module === 'string',
      )
      const match = validLinks.find(link => link.module === params[paramKey])
      if (match) return match.name
    }

    // Fallback to breadcrumbs-style pathname parsing
    return getPageFromPathname(window.location.pathname)
  })()

  useEffect(() => {
    setTitleParts({
      parentPage: parentPage || '',
      page: resolvedPage || '',
      project: project || '',
      entity: entity || '',
    })
  }, [resolvedPage, project, entity, setTitleParts])
}

export default useTitle

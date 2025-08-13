import { upperFirst } from 'lodash'

/**
 * Converts URI and pathname to breadcrumb parts
 * @param uri - The context URI (e.g., "ayon+entity://project/folder/task")
 * @param pathname - The current pathname (e.g., "/projects/demo/browser")
 * @param projectName - Optional current project name to include in breadcrumbs
 * @returns Array of breadcrumb parts
 */
export const uri2crumbs = (uri: string = '', pathname: string, projectName?: string): string[] => {
  // parse uri to path and query params
  const [scope, pathAndQuery = ''] = uri.split('://')
  const [path, query] = pathAndQuery.split('?')
  const crumbs = path.split('/').filter((crumb) => crumb)

  if (scope?.includes('ayon+settings')) {
    let settingsScope = ''
    if (query?.includes('project')) {
      settingsScope = 'Projects Manager'
    } else {
      settingsScope = 'Studio Settings'
    }

    crumbs.unshift(settingsScope)
  } else if (scope?.includes('ayon+entity')) {
    // For ayon+entity URIs (project context), always start with "Projects"
    crumbs.unshift('Projects')
    
    // Add project name
    if (projectName) {
      // If the first crumb is already the project name, don't duplicate it
      if (crumbs[1] !== projectName) {
        crumbs.push(projectName)
      }
    } else {
      // If no project name available, use the path part as project name
      if (crumbs.length > 1) {
        // Keep the existing path-based project name
      } else {
        crumbs.push('Project')
      }
    }

    // If we only have Projects + project name, add page context from pathname
    if (crumbs.length === 2 && pathname) {
      const pathParts = pathname.split('/').filter(part => {
        if (!part || part === 'projects') return false
        // Case-insensitive comparison to avoid duplicate project names with different casing
        if (projectName && part.toLowerCase() === projectName.toLowerCase()) return false
        return true
      })
      if (pathParts.length > 0) {
        // Add the page context (e.g., 'overview', 'browser', etc.)
        crumbs.push(...pathParts.map(part => upperFirst(part)))
      }
    }
  } else {
    // anything that doesn't have a uri
    let pageTitle = pathname.split('/')[1]

    if (pageTitle?.includes('settings')) {
      pageTitle = 'Studio Settings'
      crumbs.unshift(pageTitle)
    } else if (pageTitle?.includes('manageProjects')) {
      pageTitle = 'Projects Manager'
      crumbs.unshift(pageTitle)
    } else if (pageTitle === 'dashboard') {
      // Handle dashboard pages - only show the specific page/tab name, not "Dashboard"
      const pathParts = pathname.split('/').filter(part => part && part !== 'dashboard')
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1]
        // Check if it's an addon route like /dashboard/addon/addonName
        if (pathParts[0] === 'addon' && pathParts.length > 1) {
          // For addon pages, show the addon name
          crumbs.unshift(upperFirst(pathParts[1]))
        } else {
          // Show only the tab name (e.g., "Tasks", "Overview")
          crumbs.unshift(upperFirst(lastPart))
        }
      } else {
        crumbs.unshift('Dashboard')
      }
    } else {
      // just a regular url (use last part of pathname)
      crumbs.unshift(
        ...pathname
          .slice(1)
          .split('/')
          .map((p) => upperFirst(p)),
      )
    }
  }

  const qp: Record<string, string> = {}

  if (query) {
    const params = query.split('&')
    for (const param of params) {
      const [key, value] = param.split('=')
      if (key && value) {
        qp[key] = value
      }
    }
  }

  for (const level of ['product', 'task', 'workfile', 'version', 'representation']) {
    if (qp[level]) {
      crumbs.push(qp[level])
    }
  }

  return crumbs
}

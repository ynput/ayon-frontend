import { upperFirst } from 'lodash'

/**
 * Converts URI and pathname to breadcrumb parts
 * @param uri - The context URI (e.g., "ayon+entity://project/folder/task")
 * @param pathname - The current pathname (e.g., "/projects/demo/browser")
 * @returns Array of breadcrumb parts
 */
export const uri2crumbs = (uri: string = '', pathname: string): string[] => {
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
    crumbs.unshift('Project')
  } else {
    // anything that doesn't have a uri
    let pageTitle = pathname.split('/')[1]

    if (pageTitle?.includes('settings')) {
      pageTitle = 'Studio Settings'
      crumbs.unshift(pageTitle)
    } else if (pageTitle?.includes('manageProjects')) {
      pageTitle = 'Projects Manager'
      crumbs.unshift(pageTitle)
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
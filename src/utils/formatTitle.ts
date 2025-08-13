/**
 * Pure function to format page titles based on breadcrumb parts and context
 * @param breadcrumbParts - Array of breadcrumb parts from breadcrumb logic
 * @param projectName - Current project name (optional)
 * @param pathname - Current pathname (optional)
 * @returns Formatted title string
 */
export function formatTitle(
  breadcrumbParts: string[],
  projectName?: string,
  pathname?: string
): string {
  if (!breadcrumbParts.length) return 'AYON'

  const lastPart = breadcrumbParts[breadcrumbParts.length - 1]

  // Check if lastPart is already the project name (avoid duplicates)
  const isLastPartProjectName = projectName && lastPart === projectName

  // Handle specific single pages first to avoid incorrect settings detection
  const singlePages = ['/market', '/events', '/inbox', '/teams', '/services', '/api-docs']
  if (pathname && singlePages.includes(pathname)) {
    return `${lastPart} • AYON`
  }

  // Studio Settings: {tab/page} • Studio Settings OR {addon_name} • Studio Settings
  if (pathname?.includes('/settings') && !pathname.includes('manageProjects')) {
    return `${lastPart || 'Studio Settings'} • Studio Settings`
  }

  // Project Settings: {tab/page} • Manage Projects
  if (pathname?.includes('/manageProjects')) {
    return `${lastPart || 'Manage Projects'} • Manage Projects`
  }

  // Projects pages: {page/tab} • {project_name}
  // Example: Overview • demo_Commercial
  if (projectName && breadcrumbParts.length > 1 && !isLastPartProjectName) {
    return `${lastPart} • ${projectName}`
  }

  // Single pages OR Home/Dashboard pages with single breadcrumb: {page_name} • AYON
  // Example: Market • AYON
  if (breadcrumbParts.length === 1) {
    return `${breadcrumbParts[0]} • AYON`
  }

  // Home/Dashboard pages with multiple breadcrumbs but no project: {page/tab} • AYON
  // Example: Tasks • AYON, Planner • AYON
  if (breadcrumbParts.length > 1 && !projectName) {
    return `${lastPart} • AYON`
  }

  // If lastPart is already project name, show as single page: {project_name} • AYON
  if (isLastPartProjectName) {
    return `${lastPart} • AYON`
  }

  // Fallback
  return breadcrumbParts.join(' / ') || 'AYON'
}
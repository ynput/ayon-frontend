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

  // 1. Projects pages: {page/tab} • {project_name}
  // Example: Overview • demo_Commercial
  // (If the last part of breadcrumbs is already the project name, do not duplicate it.)
  if (projectName && breadcrumbParts.length > 1 && !isLastPartProjectName) {
    return `${lastPart} • ${projectName}`
  }

  // Handle specific single pages first to avoid incorrect settings detection
  const singlePages = ['/market', '/events', '/inbox', '/teams', '/services', '/api-docs']
  if (pathname && singlePages.includes(pathname)) {
    return `${lastPart} • AYON`
  }

  // 2. Studio Settings: {tab/page} • Studio Settings
  // Example: Bundles • Studio Settings
  // 3. Addon in Studio Settings: {addon_name} • Studio Settings
  // Example: maya • Studio Settings
  if (pathname?.includes('/settings') && !pathname.includes('manageProjects')) {
    return `${lastPart || 'Studio Settings'} • Studio Settings`
  }

  // 4. Project Settings: {tab/page} • Manage Projects
  // Example: Bundles • Manage Projects
  if (pathname?.includes('/manageProjects')) {
    return `${lastPart || 'Manage Projects'} • Manage Projects`
  }

  // 5. Single pages: {page_name} • AYON
  // Example: Market • AYON
  if (breadcrumbParts.length === 1) {
    return `${breadcrumbParts[0]} • AYON`
  }

  // 6. Home/Dashboard: {page/tab} • AYON
  // Example: Planner • AYON
  if (breadcrumbParts.length > 1 && !projectName) {
    return `${lastPart} • AYON`
  }

  // If lastPart is already project name, format appropriately
  if (isLastPartProjectName) {
    return `${lastPart} • AYON`
  }

  // 7. If none of the above applies, use breadcrumbs.join(' / ') or 'AYON' as a fallback
  return breadcrumbParts.join(' / ') || 'AYON'
}
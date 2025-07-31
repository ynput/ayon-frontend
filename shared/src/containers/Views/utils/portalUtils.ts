import { ViewType } from '../index'

/**
 * Generate a consistent portal container ID for views
 */
export const getViewsPortalId = (viewType: ViewType): string => {
  return `${viewType}-views-portal`
}

/**
 * Get the portal container element by viewType
 */
export const getViewsPortalContainer = (viewType: ViewType): HTMLElement | null => {
  return document.getElementById(getViewsPortalId(viewType))
}

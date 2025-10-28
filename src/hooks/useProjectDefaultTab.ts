const STORAGE_KEY = 'project-default-tab'

/**
 * Hook to manage the default project tab preference
 * Stores the last visited tab in localStorage and retrieves it for new project navigation
 */
export const useProjectDefaultTab = () => {
  /**
   * Get the stored default tab, fallback to 'overview'
   */
  const getDefaultTab = (): string => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored || 'overview'
    } catch {
      return 'overview'
    }
  }

  /**
   * Store the current tab as the default for future project navigation
   */
  const setDefaultTab = (tab: string): void => {
    try {
      localStorage.setItem(STORAGE_KEY, tab)
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Track the current tab and store it as default when the tab changes
   * This should be called from the ProjectPage component
   */
  const trackCurrentTab = (currentTab: string, isAddon: boolean = false): void => {
    if (currentTab) {
      // For addon pages, prefix with 'addon/' to distinguish from built-in modules
      const tabToStore = isAddon ? `addon/${currentTab}` : currentTab
      setDefaultTab(tabToStore)
    }
  }

  return {
    getDefaultTab,
    setDefaultTab,
    trackCurrentTab,
  }
}

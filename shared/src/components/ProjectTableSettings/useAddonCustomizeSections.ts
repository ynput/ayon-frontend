import { createElement, useMemo } from 'react'
import { ContributionView, useContributions } from '@ynput/ayon-addon'
import type { ProjectTablePage } from '@ynput/ayon-addon'
import { useProjectContext } from '@shared/context'
import type { SettingConfig } from '@shared/components/SettingsPanel/SettingsPanel'

/**
 * The sections addons contribute to this page's Customize panel (projectTable.customizeSection
 * slot, @ynput/ayon-addon), for ProjectTableSettings' `settings`. The entries show from the
 * descriptions; a section's code loads when it is opened (the panel only renders the open one).
 */
export const useAddonCustomizeSections = (page: ProjectTablePage): SettingConfig[] => {
  const { projectName } = useProjectContext()
  const { contributions } = useContributions('projectTable.customizeSection')

  return useMemo(() => {
    const context = { projectName, page }
    return contributions
      .filter((section) => !section.pages?.length || section.pages.includes(page))
      .map((section) => ({
        // namespaced, so it can't replace a built-in section (settings are merged by id)
        id: `addon:${section.key}`,
        title: section.title,
        icon: section.icon,
        component: createElement(ContributionView<'projectTable.customizeSection'>, {
          contribution: section,
          context,
        }),
      }))
  }, [contributions, projectName, page])
}

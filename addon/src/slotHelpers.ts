// One helper per slot, so a manifest reads as a list of places:
//   projectPage({ id: 'budget', title: 'Budget', component: () => import('./BudgetPage') })
// Each is `contribute(<slot>, ...)` with the slot's types.
import { contribute } from './contributions'
import type { ContributionFields } from './contributions'

/** A tab on the project page, at `/projects/<project>/<id>`. */
export const projectPage = (page: ContributionFields<'project.page'>) =>
  contribute('project.page', page)

/** A tab on the dashboard, at `/dashboard/<id>`. */
export const studioPage = (page: ContributionFields<'studio.page'>) =>
  contribute('studio.page', page)

/** A tab in the details panel, for the entity types it lists. */
export const detailsPanelTab = (tab: ContributionFields<'detailsPanel.tab'>) =>
  contribute('detailsPanel.tab', tab)

/** An item in the details panel's "more" menu, for the entity types it lists. */
export const detailsPanelMenuItem = (item: ContributionFields<'detailsPanel.menuItem'>) =>
  contribute('detailsPanel.menuItem', item)

/** An item in the project tables' right-click menu, acting on the selected entities. */
export const entityMenuItem = (item: ContributionFields<'entityMenuItem'>) =>
  contribute('entityMenuItem', item)

/** An item in the project list's right-click menu and/or "more" dropdown (`in`). */
export const projectListMenuItem = (item: ContributionFields<'projectList.menuItem'>) =>
  contribute('projectList.menuItem', item)

/** An item in the slicer's right-click menu and/or panel dropdown (`in`). */
export const slicerMenuItem = (item: ContributionFields<'slicer.menuItem'>) =>
  contribute('slicer.menuItem', item)

/** A button in the project tables' toolbar: navigates, runs code, or opens a dialog, menu or popover. */
export const projectTableToolbarItem = (item: ContributionFields<'projectTable.toolbarItem'>) =>
  contribute('projectTable.toolbarItem', item)

/** A section in the project tables' Customize panel. */
export const projectTableCustomizeSection = (
  section: ContributionFields<'projectTable.customizeSection'>,
) => contribute('projectTable.customizeSection', section)

/** A read-only column in the project tables. */
export const tableColumn = (column: ContributionFields<'tableColumn'>) =>
  contribute('tableColumn', column)

/** A button in the main header: navigates, runs code, or opens a dialog, menu or popover. */
export const headerItem = (item: ContributionFields<'header.item'>) =>
  contribute('header.item', item)

/** A keyboard shortcut on the cells of AYON's tables, acting on the selected rows. */
export const tableShortcut = (shortcut: ContributionFields<'table.shortcut'>) =>
  contribute('table.shortcut', shortcut)

/** Code with no UI that runs while AYON is open: a component mounted once for the whole app. */
export const appService = (service: ContributionFields<'app.service'>) =>
  contribute('app.service', service)

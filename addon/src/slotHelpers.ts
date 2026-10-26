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

/** A read-only column in the project tables. */
export const tableColumn = (column: ContributionFields<'tableColumn'>) =>
  contribute('tableColumn', column)

/** A button in the main header that opens the addon's dialog or popover. */
export const headerItem = (item: ContributionFields<'header.item'>) =>
  contribute('header.item', item)

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

/** A button in the main header that opens the addon's dialog or popover. */
export const headerItem = (item: ContributionFields<'header.item'>) =>
  contribute('header.item', item)

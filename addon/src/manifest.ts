// @ynput/ayon-addon/manifest: what an addon's manifest module uses to declare its contributions.
// Unlike the main entry this is bundled into the addon (it is plain functions, no state): the
// manifest loads at startup on whatever AYON version the server runs, and a helper missing in an
// older AYON must not stop the manifest from loading. The host then skips contributions to
// slots it doesn't know, and the rest of the addon works.
export { contribute, defineAddon } from './contributions'
export type { AddonManifest, ContributionFields, ContributionInput } from './contributions'
export {
  detailsPanelMenuItem,
  detailsPanelTab,
  entityMenuItem,
  headerItem,
  projectPage,
  studioPage,
  tableColumn,
} from './slotHelpers'

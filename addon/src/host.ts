// @ynput/ayon-addon/host: for hosts only (ayon-frontend, the standalone dev shell), never for
// addon code. Loads manifests into the registry and provides the host's implementations.

/** The module an addon exposes, and lists in `frontend_modules`, to declare its contributions. */
export const MANIFEST_MODULE = 'manifest'

export {
  contributionTags,
  getContributions,
  getRegistry,
  isExample,
  registerManifest,
  registerManifests,
  setContributionTags,
  setContributionWrappers,
  setManifestsLoading,
  setSlotExamples,
  subscribeRegistry,
  unregisterAddon,
  useContributionWrappers,
} from './registry'
export type { ContributionTags, ManifestEntry } from './registry'
export {
  checkManifest,
  checkSlotDeclarations,
  formatSkipped,
  formatSkippedDeclaration,
  ID_PATTERN,
} from './validate'
export type {
  DeclarationCheck,
  DeclaredSlot,
  ManifestCheck,
  SkippedContribution,
  SkippedDeclaration,
} from './validate'
export { isKnownSlot, SLOTS } from './slots'
export type { SlotDeclaration, SlotDefinition, SlotExample } from './slots'
export { getHost, provideHost } from './hostBridge'
export { slotInfo } from './slotInfo'
export type { SlotInfo } from './slotInfo'
export type { DevSlots, HostComponents, HostImplementation } from './hostBridge'
export type { HostMoreMenuProps } from './MoreMenu'
export type { HostOpenContextMenu } from './useContextMenu'
export { contributionTitle, loadPiece, pieceContext, reportContributionError, usePiece } from './pieces'
export type { PieceState } from './pieces'
export { ContributionError } from './ContributionView'
export { menuItemsAt } from './menus'
export { cellCopyText, onTableColumnRefresh, readCellValue } from './tableColumns'
export { isReservedShortcut, matchesShortcut, parseShortcut } from './shortcuts'
export type { Shortcut } from './shortcuts'

// @ynput/ayon-addon/host: for hosts only (ayon-frontend, the standalone dev shell), never for
// addon code. Loads manifests into the registry and provides the host's implementations.

/** The module an addon exposes, and lists in `frontend_modules`, to declare its contributions. */
export const MANIFEST_MODULE = 'manifest'

export {
  getContributions,
  getRegistry,
  registerManifest,
  registerManifests,
  setManifestsLoading,
  unregisterAddon,
} from './registry'
export type { ManifestEntry } from './registry'
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
export type { SlotDeclaration, SlotDefinition } from './slots'
export { getHost, provideHost } from './hostBridge'
export type { DevSlotOutletProps, DevSlots, HostComponents, HostImplementation } from './hostBridge'
export type { HostMoreMenuProps } from './MoreMenu'
export type { HostOpenContextMenu } from './useContextMenu'
export { contributionTitle, loadPiece, pieceContext, reportContributionError, usePiece } from './pieces'
export type { PieceState } from './pieces'
export { ContributionError } from './ContributionView'
export { menuItemsAt } from './menus'
export { onTableColumnRefresh } from './tableColumns'
export { isReservedShortcut, matchesShortcut, parseShortcut } from './shortcuts'
export type { Shortcut } from './shortcuts'

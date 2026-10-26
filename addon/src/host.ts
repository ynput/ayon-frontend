// @ynput/ayon-addon/host: for hosts only (ayon-frontend, the standalone dev shell), never for
// addon code. Loads manifests into the registry and provides the host's implementations.

/** The module an addon exposes, and lists in `frontend_modules`, to declare its contributions. */
export const MANIFEST_MODULE = 'manifest'

export {
  getContributions,
  getRegistry,
  registerManifest,
  setManifestsLoading,
  unregisterAddon,
} from './registry'
export { checkManifest, formatSkipped, ID_PATTERN } from './validate'
export type { ManifestCheck, SkippedContribution } from './validate'
export { isKnownSlot, SLOTS } from './slots'
export type { SlotDefinition } from './slots'
export { getHost, provideHost } from './hostBridge'
export type { HostImplementation } from './hostBridge'
export { contributionTitle, loadPiece, reportContributionError, usePiece } from './pieces'
export type { PieceState } from './pieces'
export { ContributionError } from './ContributionView'

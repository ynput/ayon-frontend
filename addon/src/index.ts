// @ynput/ayon-addon: the public API for addon frontends.
// Inside AYON this is always AYON's own copy (addons list it in their federation `shared` with
// `import: false`), so everything here works in every slot. What depends on the slot comes only
// from useSlot / the props of the contribution's component.

// slots and manifests (the manifest itself uses @ynput/ayon-addon/manifest, see there)
export type { Loader, SlotContext, SlotMap, SlotName, SlotProps } from './slots'
export type {
  AddonInfo,
  AddonManifest,
  AnyContribution,
  Contribution,
  ContributionInput,
} from './contributions'
export { useSlot } from './useSlot'
export { useContributions } from './registry'
export type { ContributionsResult } from './registry'
export { ContributionView, ContributionErrorBoundary } from './ContributionView'
export type { ContributionViewProps } from './ContributionView'
export { prefetchPiece, runContribution } from './pieces'

// globals: the same in every slot
export { useUser } from './globals'
export type { AddonUser } from './hostBridge'
// the host's router and toasts: an addon's own copies would have no router or container
export { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
export { toast } from 'react-toastify'

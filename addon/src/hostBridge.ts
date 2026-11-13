import type { ComponentType } from 'react'
import type {
  ProjectListProps,
  ProjectPageLayoutProps,
  SlicerProps,
  StudioPageLayoutProps,
} from './layout'
import type { EntityPickerProps } from './EntityPicker'
import type { EntityTableProps } from './EntityTable'
import type { HostMoreMenuProps } from './MoreMenu'
import type { AddonUser } from './scopes'
import type { EntityLinkRef } from './entityLinks'
import type { ViewerTarget } from './openInHost'
import type { HostOpenContextMenu } from './useContextMenu'

export type { AddonUser }

// What the host provides to the package at startup. The package itself imports nothing from
// the host app or @ynput/ayon-frontend-shared; components and hooks that need the host's own
// code (its user state, its project list, its slicer) call the implementation registered here.
// The standalone dev shell registers its own.

/**
 * Dispatches to AYON's store: plain actions, and thunks such as `api.endpoints.x.initiate(args)`
 * from `@ynput/ayon-frontend-shared/api`, which return what the thunk returns.
 */
export interface AddonDispatch {
  <R>(thunk: (dispatch: any, getState: () => any, extra: any) => R): R
  <A extends { type: string }>(action: A): A
}

/** The host's implementations of the layout components, the entity picker and the menu button. */
export interface HostComponents {
  ProjectPageLayout: ComponentType<ProjectPageLayoutProps>
  Slicer: ComponentType<SlicerProps>
  StudioPageLayout: ComponentType<StudioPageLayoutProps>
  ProjectList: ComponentType<ProjectListProps>
  /** AYON's entity picker, with the project's providers it needs (`EntityPicker`) */
  EntityPicker: ComponentType<EntityPickerProps>
  /** AYON's menu under a button (`MoreMenu`) */
  MoreMenu: ComponentType<HostMoreMenuProps>
  /** AYON's project table with the providers it needs (`EntityTable`); not in the dev shell */
  EntityTable?: ComponentType<EntityTableProps>
}

/**
 * Internal, for the standalone dev shell only: AYON never sets it. Tells the shell the context each
 * slot passes, for its Context panel: `SlotOutlet` calls `useOutletReport` (a hook) on every render,
 * `useSlotMenuItems` calls `menuBuilt` when a menu of the slot is built (it opens). Without it,
 * both work exactly as in AYON.
 */
export interface DevSlots {
  /** a `SlotOutlet` of the slot renders with this context */
  useOutletReport?: (slot: string, context: unknown) => void
  /** a menu of the slot was built (it opens): its context and the keys of its contributions */
  menuBuilt?: (slot: string, context: unknown, contributions: string[]) => void
}

export interface HostImplementation {
  useUser?: () => AddonUser | undefined
  /** the same user outside React: `run` and `menu` pieces get it in their context */
  getUser?: () => AddonUser | undefined
  /** the dispatch of the host's store */
  dispatch?: AddonDispatch
  /** goes to an AYON URL without reloading the page (`navigate`, `navigateToEntity`) */
  navigate?: (to: string) => void
  /** opens AYON's viewer (`openViewer`) */
  openViewer?: (target: ViewerTarget) => void
  /**
   * shows the details panel of the page that is open, if it has one (`openDetails`). Returns
   * `false` when there is none, or it can't show these entities.
   */
  openDetails?: (entities: readonly EntityLinkRef[]) => boolean
  /** closes that panel (`closeDetails`) */
  closeDetails?: () => void
  /** a hook returning the opener of AYON's right-click menu (`useContextMenu`) */
  useContextMenu?: () => HostOpenContextMenu
  components?: Partial<HostComponents>
  /** @internal the dev shell's slot reports (`DevSlots`); never set by AYON */
  devSlots?: DevSlots
}

let host: HostImplementation = {}

/** Registers the host's implementations. Call before the first render. */
export const provideHost = (implementation: HostImplementation) => {
  host = {
    ...host,
    ...implementation,
    components: { ...host.components, ...implementation.components },
  }
}

export const getHost = (): Readonly<HostImplementation> => host

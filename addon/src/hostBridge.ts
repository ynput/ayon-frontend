import type { ComponentType } from 'react'
import type {
  ProjectListProps,
  ProjectPageLayoutProps,
  SlicerProps,
  StudioPageLayoutProps,
} from './layout'

// What the host provides to the package at startup. The package itself imports nothing from
// the host app or @ynput/ayon-frontend-shared; components and hooks that need the host's own
// code (its user state, its project list, its slicer) call the implementation registered here.
// The standalone dev shell registers its own.

/** The signed-in user, as addons see it. */
export interface AddonUser {
  name: string
  fullName?: string
  email?: string
  isAdmin: boolean
  isManager: boolean
  isGuest: boolean
  /** developer mode is on */
  isDeveloper: boolean
}

/**
 * Dispatches to AYON's store: plain actions, and thunks such as `api.endpoints.x.initiate(args)`
 * from `@ynput/ayon-frontend-shared/api`, which return what the thunk returns.
 */
export interface AddonDispatch {
  <R>(thunk: (dispatch: any, getState: () => any, extra: any) => R): R
  <A extends { type: string }>(action: A): A
}

/** The host's implementations of the layout components. */
export interface HostComponents {
  ProjectPageLayout: ComponentType<ProjectPageLayoutProps>
  Slicer: ComponentType<SlicerProps>
  StudioPageLayout: ComponentType<StudioPageLayoutProps>
  ProjectList: ComponentType<ProjectListProps>
}

export interface HostImplementation {
  useUser?: () => AddonUser | undefined
  /** the dispatch of the host's store */
  dispatch?: AddonDispatch
  components?: Partial<HostComponents>
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

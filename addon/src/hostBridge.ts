import type { ComponentType } from 'react'
import type {
  ProjectListProps,
  ProjectPageLayoutProps,
  SlicerProps,
  StudioPageLayoutProps,
} from './layout'
import type { EntityPickerProps } from './EntityPicker'
import type { AddonUser } from './scopes'

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

/** The host's implementations of the layout components and the entity picker. */
export interface HostComponents {
  ProjectPageLayout: ComponentType<ProjectPageLayoutProps>
  Slicer: ComponentType<SlicerProps>
  StudioPageLayout: ComponentType<StudioPageLayoutProps>
  ProjectList: ComponentType<ProjectListProps>
  /** AYON's entity picker, with the project's providers it needs (`EntityPicker`) */
  EntityPicker: ComponentType<EntityPickerProps>
}

export interface HostImplementation {
  useUser?: () => AddonUser | undefined
  /** the same user outside React: `run` and `menu` pieces get it in their context */
  getUser?: () => AddonUser | undefined
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

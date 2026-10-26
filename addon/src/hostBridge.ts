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

export interface HostImplementation {
  useUser?: () => AddonUser | undefined
}

let host: HostImplementation = {}

/** Registers the host's implementations. Call before the first render. */
export const provideHost = (implementation: HostImplementation) => {
  host = { ...host, ...implementation }
}

export const getHost = (): Readonly<HostImplementation> => host

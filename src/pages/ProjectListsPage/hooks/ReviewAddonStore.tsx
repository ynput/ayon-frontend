import { PropsWithChildren, useContext } from 'react'
import { ReactReduxContext, ReactReduxContextValue } from 'react-redux'
import { AddonStoreContext } from './ReviewAddonStoreContextInstance'

// react-redux shares one context object with the addon's bundled copy, and review addons up to
// 0.7.5 put their own store around ReviewCardsProvider's children. Host components inside would
// then run on the addon's copy of the API, where host-only endpoints fail in its middleware.
// HostStore gives those children the host store back, AddonStore the addon's components their own.
export function HostStore({
  host,
  children,
}: PropsWithChildren<{ host: ReactReduxContextValue | null }>) {
  const addon = useContext(ReactReduxContext)
  return (
    <AddonStoreContext.Provider value={addon}>
      <ReactReduxContext.Provider value={host}>{children}</ReactReduxContext.Provider>
    </AddonStoreContext.Provider>
  )
}

export function AddonStore({ children }: PropsWithChildren) {
  const addon = useContext(AddonStoreContext)
  if (!addon) return <>{children}</>
  return <ReactReduxContext.Provider value={addon}>{children}</ReactReduxContext.Provider>
}

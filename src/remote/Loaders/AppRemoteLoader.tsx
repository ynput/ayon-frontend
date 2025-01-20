import { FC } from 'react'
import { useRemoteModules } from '@/remote/remoteModulesContext'
import useLoadModule from '@/remote/useLoadModule'

interface AppRemoteLoaderProps {}

const AppRemoteLoader: FC<AppRemoteLoaderProps> = () => {
  const { modules } = useRemoteModules()

  return (
    <>
      {modules.map((addon) =>
        Object.entries(addon.modules).map(([remote, modulesList]) =>
          modulesList
            .filter((m) => m.includes('App'))
            .map((module) => {
              const [RemoteApp, { isLoaded }] = useLoadModule<FC>({
                addon: addon.addonName,
                remote,
                module,
                fallback: () => null,
              })

              if (!isLoaded) return null

              return <RemoteApp key={`${addon.addonName}-${remote}-${module}`} />
            }),
        ),
      )}
    </>
  )
}

export default AppRemoteLoader

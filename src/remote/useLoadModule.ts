import { useRemoteModules } from '@/remote/context/RemoteModulesContext'
import { loadRemote } from '@module-federation/enhanced/runtime'
import { useEffect, useRef, useState } from 'react'
import semver from 'semver'

interface Props<T> {
  addon: string
  remote: string
  module: string
  fallback: T
  debug?: boolean
  minVersion?: string // minimum version required for this module
}

const useLoadModule = <T>({
  addon,
  remote,
  module,
  fallback,
  minVersion,
}: Props<T>): [T, { isLoaded: boolean; outdated?: { current: string; required: string } }] => {
  const { remotesInitialized, modules } = useRemoteModules()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isOutdated, setIsOutdated] = useState(false)
  const loadedRemote = useRef<T>(fallback)

  useEffect(() => {
    // wait for remotes to be initialized
    if (!remotesInitialized || !addon || !remote || !module) return

    // check if remote and module exist
    const initializedRemote = modules.find((m) => m.addonName === addon)

    if (!initializedRemote) return console.log('remote not found', { addon, remote, module })

    // check remote meets minimum version requirement
    if (minVersion && !semver.gte(initializedRemote.addonVersion, minVersion)) {
      console.log('remote version does not meet minimum requirement', {
        addon,
        remote,
        module,
        current: initializedRemote.addonVersion,
        required: minVersion,
      })

      setIsOutdated(true)

      // use fallback if version requirement not met
      return
    }

    setIsOutdated(false)

    const initializedModule = initializedRemote.modules[remote]

    if (!initializedModule) return console.log('module not found', { addon, remote, module })

    // check if module is already loaded
    if (isLoaded) return
    loadRemote<{ default: T }>(`${remote}/${module}`, {
      from: 'runtime',
    })
      .then((remote) => {
        console.log('loaded remote', module)
        setIsLoaded(true)
        if (remote) loadedRemote.current = remote.default
      })
      .catch((e) => {
        console.error('error loading remote', remote, module, e)
      })
  }, [isLoaded, remotesInitialized, modules, addon, remote, module, minVersion])

  return [
    loadedRemote.current,
    {
      isLoaded,
      outdated: isOutdated
        ? {
            current: modules.find((m) => m.addonName === addon)?.addonVersion || 'unknown',
            required: minVersion || 'unknown',
          }
        : undefined,
    },
  ]
}

export default useLoadModule

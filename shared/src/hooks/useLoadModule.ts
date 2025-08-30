import { useRemoteModules } from '@shared/context/RemoteModulesContext'
import { loadRemote } from '@module-federation/enhanced/runtime'
import { useEffect, useRef, useState } from 'react'
import semver from 'semver'
import { usePowerpack } from '@shared/context'
import { loadRemoteCSS } from '@shared/utils/loadRemoteCSS'

interface Props<T> {
  addon: string
  remote: string
  module: string
  fallback: T
  debug?: boolean
  minVersion?: string // minimum version required for this module
  skip?: boolean // skip loading if module is provided externally
  loadCSS?: boolean // automatically load CSS for the remote module
}

export const useLoadModule = <T>({
  addon,
  remote,
  module,
  fallback,
  minVersion,
  skip = false,
  loadCSS = false,
}: Props<T>): [
  T,
  { isLoaded: boolean; isLoading: boolean; outdated?: { current: string; required: string } },
] => {
  const { remotesInitialized, modules } = useRemoteModules()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState<string | boolean>(false)
  const [isOutdated, setIsOutdated] = useState(false)
  const loadedRemote = useRef<T>(fallback)
  const hasAttemptedLoad = useRef(false)

  useEffect(() => {
    // Reset attempt flag when dependencies change
    hasAttemptedLoad.current = false

    // skip loading if module is provided externally
    if (skip) {
      setIsLoading(false)
      setIsLoaded(true)
      return
    }

    // wait for remotes to be initialized
    if (!remotesInitialized || !addon || !remote || !module) return

    // check if remote and module exist
    const initializedRemote = modules.find((m) => m.addonName === addon)

    if (!initializedRemote) {
      console.log('remote not found', { addon, remote, module })
      setIsLoading(false)
      return
    }

    // check remote meets minimum version requirement
    if (
      minVersion &&
      !semver.gte(initializedRemote.addonVersion, minVersion) &&
      minVersion + '-dev' !== initializedRemote.addonVersion
    ) {
      console.log('remote version does not meet minimum requirement', {
        addon,
        remote,
        module,
        current: initializedRemote.addonVersion,
        required: minVersion,
      })

      setIsOutdated(true)
      setIsLoading(false)

      // use fallback if version requirement not met
      return
    }

    setIsOutdated(false)

    const initializedModule = initializedRemote.modules[remote]

    if (!initializedModule) {
      setIsLoading(false)
      return console.log('module not found', { addon, remote, module })
    }

    // check if module is already loaded
    if (isLoaded === module || hasAttemptedLoad.current) {
      setIsLoading(false)
      return
    }
    hasAttemptedLoad.current = true
    loadRemote<{ default: T }>(`${remote}/${module}`, {
      from: 'runtime',
    })
      .then((loadedModule) => {
        setIsLoaded(module)
        setIsLoading(false)
        if (loadedModule) loadedRemote.current = loadedModule.default

        if (loadCSS) {
          loadRemoteCSS(addon, initializedRemote.addonVersion, remote)
        }
      })
      .catch((e) => {
        setIsLoading(false)
        console.error('error loading remote', remote, module, e)
        // Fallback to fallback component if available
        if (fallback) {
          loadedRemote.current = fallback
          setIsLoaded(module) // Mark as loaded when using fallback
        }
      })
  }, [remotesInitialized, modules, addon, remote, module, minVersion, skip, loadCSS])

  return [
    loadedRemote.current,
    {
      isLoaded: isLoaded === module,
      isLoading,
      outdated: isOutdated
        ? {
            current: modules.find((m) => m.addonName === addon)?.addonVersion || 'unknown',
            required: minVersion?.replace('-dev', '') || 'unknown',
          }
        : undefined,
    },
  ]
}

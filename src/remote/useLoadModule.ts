import { useRemoteModules } from '@context/remoteModulesContext'
import { loadRemote } from '@module-federation/enhanced/runtime'
import { useEffect, useRef, useState } from 'react'

interface Props<T> {
  remote: string
  module: string
  fallback: T
  debug?: boolean
}

const useLoadModule = <T>({ remote, module, fallback }: Props<T>): [T, { isLoaded: boolean }] => {
  const { remotesInitialized, modules } = useRemoteModules()
  const [isLoaded, setIsLoaded] = useState(false)
  const loadedRemote = useRef<T>(fallback)

  useEffect(() => {
    // wait for remotes to be initialized
    if (!remotesInitialized) return

    // check if remote and module exist
    const initializedModule = modules.find((m) => m.addonName === remote)?.modules[remote]

    if (!initializedModule) return console.log('module not found', remote, module)

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
  }, [isLoaded, remotesInitialized, modules])

  return [loadedRemote.current, { isLoaded }]
}

export default useLoadModule
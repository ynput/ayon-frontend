import { loadRemote } from '@module-federation/enhanced/runtime'
import { useEffect, useRef, useState } from 'react'
import { RemoteType } from './registerAddonRemotes'

interface Props<T> {
  remote: RemoteType
  module: string
  fallback: T
  debug?: boolean
}

const useLoadModule = <T>({
  remote,
  module,
  fallback,
  debug,
}: Props<T>): [T, { isLoaded: boolean }] => {
  const [isLoaded, setIsLoaded] = useState(false)
  const loadedRemote = useRef<T>(fallback)

  useEffect(() => {
    if (isLoaded) return
    if (debug) console.log('loading remote', remote, module)
    loadRemote<{ default: T }>(`${remote}/${module}`, {
      from: 'runtime',
    })
      .then((remote) => {
        if (debug) console.log('loaded remote', remote, module)
        setIsLoaded(true)
        if (remote) loadedRemote.current = remote.default
      })
      .catch((e) => {
        if (debug) console.error('error loading remote', remote, module, e)
      })
  }, [isLoaded])

  return [loadedRemote.current, { isLoaded }]
}

export default useLoadModule

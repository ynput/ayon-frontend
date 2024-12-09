import { loadRemote } from '@module-federation/enhanced/runtime'
import { useEffect, useRef, useState } from 'react'
import { RemoteType } from './registerAddonRemotes'

interface Props<T> {
  remote: RemoteType
  module: string
  fallback: T
}

const useLoadRemote = <T>({ remote, module, fallback }: Props<T>) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const loadedRemote = useRef<T>(fallback)

  useEffect(() => {
    if (isLoaded) return
    // console.log('loading remote', remote, module)
    loadRemote<{ default: T }>(`${remote}/${module}`, {
      from: 'runtime',
    })
      .then((remote) => {
        setIsLoaded(true)
        if (remote) loadedRemote.current = remote.default
      })
      .catch((e) => {
        // console.error('error loading remote', remote, module, e)
      })
  }, [isLoaded])

  return loadedRemote.current
}

export default useLoadRemote

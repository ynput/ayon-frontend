import { loadRemote, registerRemotes } from '@module-federation/enhanced/runtime'
import { lazy, Suspense } from 'react'

const useRemote = (scope: string, module: string) => {
  const LazyComponent = lazy(async () => {
    registerRemotes([
      {
        name: scope,
        alias: scope,
        entry: '/addons/example/2.0.1/public/dist/remoteEntry.js',
        type: 'module',
      },
    ])

    return loadRemote<{ default: any }>(`${scope}/${module}`, {
      from: 'runtime',
    }) as Promise<{ default: any }>
  })

  return (props: any) => {
    return <LazyComponent {...props} />
  }
}

const Remote = () => {
  const RemoteComp = useRemote('remote', 'remote-app')
  return (
    <Suspense>
      <RemoteComp />
    </Suspense>
  )
}

export default Remote

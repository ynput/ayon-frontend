import { FC } from 'react'
import { useRemoteModules } from '@shared/context'
import { ModuleSpec, useLoadModule, useLoadModules } from '@shared/hooks'
import { Location, NavigateFunction, SetURLSearchParams } from 'react-router-dom'

type RemoteAppProps = {
  projectName: string
  name: string
  version: string
  location: Location<any>
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
  navigate: NavigateFunction
}

type RemoteAppNode = FC<Partial<RemoteAppProps>>

type ModulePageProps = {
  addon: {
    addonName: string
    addonVersion: string
  }
  remote: string
  module: string
  fallback?: RemoteAppNode
}

interface ProjectRemoteLoaderProps {}

const useLoadRemoteProjectPages = ({}: ProjectRemoteLoaderProps) => {
  const { modules } = useRemoteModules()
  const projectPageModules: ModuleSpec<RemoteAppNode>[] = []
  for (const addon of modules) {
    for (const remote in addon.modules) {
      const modulesList = addon.modules[remote]
      const projectModules = modulesList.filter((m) => m.includes('Project'))

      for (const module of projectModules) {
        const moduleSpec: ModuleSpec<RemoteAppNode> = {
          addon: addon.addonName,
          remote,
          module,
        }
        projectPageModules.push(moduleSpec)
      }
    }
  }

  //   const location = useLocation()
  // const navigate = useNavigate()
  // const [searchParams, setSearchParams] = useSearchParams()

  const results = useLoadModules(projectPageModules)
  console.log('PP: results', results)

  const loadedPages: { name: string; module: string; component: RemoteAppNode }[] = []
  for (const result of results) {
    if (result[1].isLoaded && result[1].module === 'Project') {
      // add to loadedPages
      loadedPages.push({
        name: result[0].name || result[1].remote,
        module: result[0].module || result[1].remote,
        component: result[0].component,
      })
    }
  }

  return loadedPages
}

export default useLoadRemoteProjectPages

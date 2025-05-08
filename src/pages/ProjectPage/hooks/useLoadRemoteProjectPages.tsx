import { FC } from 'react'
import { useRemoteModules } from '@shared/context'
import { ModuleSpec, useLoadModules } from '@shared/hooks'
import { Location, NavigateFunction, SetURLSearchParams } from 'react-router-dom'
import LoadingPage from '@pages/LoadingPage'

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

type PermanentAddon = 'review'

type LoadedPage = {
  name: string
  module: string
  component: RemoteAppNode
}

export type Fallbacks = Map<PermanentAddon, LoadedPage>
interface ProjectRemoteLoaderProps {
  fallbacks: Fallbacks
}

const useLoadRemoteProjectPages = ({ fallbacks }: ProjectRemoteLoaderProps) => {
  const { modules, isLoading: isLoadingModules } = useRemoteModules()
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
          fallback: fallbacks.get(module as PermanentAddon)?.component,
        }
        projectPageModules.push(moduleSpec)
      }
    }
  }

  const { modules: modulesData, isLoading: isLoadingModulePages } =
    useLoadModules(projectPageModules)

  console.log('PP: modules', modules)
  console.log('PP: loading modules', isLoadingModulePages)

  const loadedPages: LoadedPage[] = []
  for (const result of modulesData) {
    if (result[1].isLoaded && result[1].module === 'Project') {
      // add to loadedPages
      loadedPages.push({
        name: result[0].name || result[1].remote,
        module: result[0].module || result[1].remote,
        component: result[0].component,
      })
    }
  }

  // for each fallback, check if we are currently loading the modules
  for (const [key, fallback] of fallbacks.entries()) {
    const isLoaded = loadedPages.some((page) => page.module === key)
    if (!isLoaded) {
      const showLoadingPage =
        isLoadingModules || (isLoadingModulePages && modules.find((m) => m.addonName === key))
      // modules has not been loaded yet (or ever)
      // if we are loading, then add a loading page
      loadedPages.push({
        name: fallback.name || key,
        module: fallback.module || key,
        component: showLoadingPage ? LoadingPage : fallback.component,
      })
    }
  }

  return loadedPages
}

export default useLoadRemoteProjectPages

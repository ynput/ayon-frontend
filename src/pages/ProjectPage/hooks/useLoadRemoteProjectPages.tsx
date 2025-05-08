import { FC, useMemo } from 'react'
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
  id: string
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
  const projectPageModules: ModuleSpec<LoadedPage>[] = []
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
  console.log('PP: loaded modules', modulesData)

  const loadedPages = useMemo(() => {
    // Build loadedPages array immutably instead of using push
    // First collect pages from loaded modules
    const modulesPages = modulesData
      .filter((result) => result[1].isLoaded)
      .map((result) => ({
        id: result[0].id,
        name: result[0].name || result[1].remote,
        module: result[0].module || result[1].remote,
        component: result[0].component,
      }))

    // Then add fallbacks for modules that aren't loaded
    const fallbackPages = Array.from(fallbacks.entries())
      .filter(([key]) => !modulesPages.some((page) => page.id === key))
      .map(([key, fallback]) => {
        const showLoadingPage =
          isLoadingModules || (isLoadingModulePages && modules.find((m) => m.addonName === key))

        return {
          name: fallback.name || key,
          module: fallback.module || key,
          component: showLoadingPage ? LoadingPage : fallback.component,
        }
      })
    console.log('PP: modules pages', modulesPages)
    console.log('PP: fallback pages', fallbackPages)

    // Combine both arrays immutably
    return [...modulesPages, ...fallbackPages]
  }, [modulesData, fallbacks, isLoadingModules, isLoadingModulePages, modules])

  return loadedPages
}

export default useLoadRemoteProjectPages

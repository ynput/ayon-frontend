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

type DataType = Record<string, any>
type LoadedPage<T = DataType> = {
  id: string
  component: RemoteAppNode
  data: T
}

export type Fallbacks<T = DataType> = Map<PermanentAddon, LoadedPage<T>>
interface ProjectRemoteLoaderProps<T = DataType> {
  fallbacks: Fallbacks<T>
  moduleKey: 'Project' | 'Route'
  skip?: boolean
}

const useLoadRemotePages = <T extends DataType>({
  fallbacks,
  moduleKey,
  skip = false,
}: ProjectRemoteLoaderProps<T>) => {
  const { modules, remotesInitialized } = useRemoteModules()

  const projectPageModules = useMemo<ModuleSpec<RemoteAppNode>[]>(() => {
    const pageModules: ModuleSpec<RemoteAppNode>[] = []
    for (const addon of modules) {
      for (const remote in addon.modules) {
        const modulesList = addon.modules[remote]
        const projectModules = modulesList.filter((m) => m.includes(moduleKey))

        for (const module of projectModules) {
          const moduleSpec: ModuleSpec<RemoteAppNode> = {
            addon: addon.addonName,
            remote,
            module,
            fallback: fallbacks.get(module as PermanentAddon)?.component,
          }
          pageModules.push(moduleSpec)
        }
      }
    }
    return pageModules
  }, [modules, fallbacks, moduleKey])

  // get remote project module pages
  const { modules: modulesData, isLoading: isLoadingModulePages } = useLoadModules(
    projectPageModules,
    modules,
    !remotesInitialized || skip,
  )

  const loadedPages = useMemo(() => {
    const modulesPages = modulesData
      .filter((result) => result[1].isLoaded)
      .map((result) => ({
        id: result[0].id,
        component: result[0].component,
        data: result[0].data as T,
        isFallback: false,
      }))

    const fallbackPages = Array.from(fallbacks.entries())
      .filter(([key]) => !modulesPages.some((page) => page.id === key))
      .map(([key, fallback]) => {
        const showLoadingPage =
          !remotesInitialized || (isLoadingModulePages && modules.find((m) => m.addonName === key))

        return {
          id: key,
          component: showLoadingPage ? LoadingPage : fallback.component,
          data: fallback.data,
          isFallback: true,
        }
      })

    return [...modulesPages, ...fallbackPages]
  }, [modulesData, fallbacks, remotesInitialized, isLoadingModulePages, modules])

  return loadedPages
}

export default useLoadRemotePages

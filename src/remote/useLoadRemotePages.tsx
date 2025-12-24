import { useMemo } from 'react'
import { useRemoteModules } from '@shared/context'
import { ModuleSpec, useLoadModules } from '@shared/hooks'
import LoadingPage from '@pages/LoadingPage'

interface ProjectRemoteLoaderProps {
  fallbacks?: Map<string, any>
  moduleKey: 'Studio' | 'Project' | 'Route'
  skip?: boolean
}

export const useLoadRemotePages = ({
  fallbacks,
  moduleKey,
  skip = false,
}: ProjectRemoteLoaderProps) => {
  const { modules, remotesInitialized } = useRemoteModules()

  const pageModules = useMemo<ModuleSpec<any>[]>(() => {
    const pageModules: ModuleSpec<any>[] = []
    for (const addon of modules) {
      for (const remote in addon.modules) {
        const modulesList = addon.modules[remote]
        const projectModules = modulesList.filter((m) => m.includes(moduleKey))

        for (const module of projectModules) {
          const moduleSpec: ModuleSpec<any> = {
            addon: addon.addonName,
            remote,
            module,
            fallback: fallbacks?.get(module)?.component,
          }
          pageModules.push(moduleSpec)
        }
      }
    }
    return pageModules
  }, [modules, fallbacks, moduleKey])

  // get remote project module pages
  const { modules: modulesData, isLoading: isLoadingModulePages } = useLoadModules(
    pageModules,
    modules,
    !remotesInitialized || skip,
  )

  const loadedPages = useMemo(() => {
    const modulesPages = modulesData
      .filter((result) => result[1].isLoaded)
      .map((result) => ({
        ...result[0],
        isFallback: false,
      }))

    const fallbackPages = Array.from(fallbacks?.entries() || [])
      .filter(([key]) => !modulesPages.some((page) => page.id === key))
      .map(([key, fallback]) => {
        const showLoadingPage =
          !remotesInitialized || (isLoadingModulePages && modules.find((m) => m.addonName === key))

        return {
          ...fallback,
          component: showLoadingPage ? LoadingPage : fallback.component,
          isFallback: true,
        }
      })

    return [...modulesPages, ...fallbackPages]
  }, [modulesData, fallbacks, remotesInitialized, isLoadingModulePages, modules])

  return { remotePages: loadedPages, isLoading: isLoadingModulePages }
}

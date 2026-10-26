import { useMemo } from 'react'
import { useRemoteModules } from '@shared/context'
import { useListBundlesQuery } from '@shared/api'
import { ModuleSpec, useLoadModules } from '@shared/hooks'
import type { BundleMode } from '@shared/util'
import LoadingPage from '@pages/LoadingPage'

// set on pages whose addon comes from the staging or dev bundle, not production
export type RemotePageBundle = {
  variant: Exclude<BundleMode, 'production'>
  addonName: string
  addonVersion: string
}

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
  const {
    modules,
    remotesInitialized,
    isLoading: isLoadingRemotes,
    variant = 'production',
  } = useRemoteModules()

  // with no dev bundle the server sends the production modules, so they aren't marked as dev
  const { data: { bundles = [] } = {}, isSuccess: hasCheckedDevBundles } = useListBundlesQuery(
    { archived: false },
    { skip: variant !== 'developer' },
  )
  const hasDevBundle = bundles.some((bundle) => bundle.isDev)
  const pagesVariant =
    variant === 'developer' && !(hasCheckedDevBundles && hasDevBundle) ? 'production' : variant

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
    skip,
  )

  const loadedPages = useMemo(() => {
    const modulesPages = modulesData
      .filter((result) => result[1].isLoaded)
      .map(([page, { addon }]) => {
        const addonVersion = modules.find((m) => m.addonName === addon)?.addonVersion
        const remoteBundle: RemotePageBundle | undefined =
          pagesVariant !== 'production' && addonVersion
            ? { variant: pagesVariant, addonName: addon, addonVersion }
            : undefined

        return { ...page, isFallback: false, remoteBundle }
      })

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
  }, [modulesData, fallbacks, remotesInitialized, isLoadingModulePages, modules, pagesVariant])

  return {
    remotePages: loadedPages,
    // remotes not being registered yet means their modules haven't started loading
    isLoading: !skip && (isLoadingModulePages || isLoadingRemotes || !remotesInitialized),
  }
}

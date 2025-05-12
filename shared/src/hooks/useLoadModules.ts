import { useRemoteModules } from '@shared/context/RemoteModulesContext'
import { loadRemote } from '@module-federation/enhanced/runtime'
import { useEffect, useRef, useState } from 'react'
import semver from 'semver'
import { FrontendModuleListItem } from '@shared/api'

export interface ModuleSpec<T> {
  addon: string
  remote: string
  module: string
  fallback?: T
  debug?: boolean
  minVersion?: string
}

type ModuleResult<T> = [
  T,
  {
    isLoaded: boolean
    addon: string
    remote: string
    module: string
    minVersion?: string
    outdated?: {
      current: string
      required: string
    }
  },
]

export const useLoadModules = <T extends any[]>(
  moduleSpecs: ModuleSpec<T[number]>[],
  modules: FrontendModuleListItem[],
  skip: boolean,
): { modules: ModuleResult<T[number]>[]; isLoading: boolean } => {
  // Use a ref to track which modules have been processed
  const processedModules = useRef<Set<string>>(new Set())

  // Initialize results state
  const [results, setResults] = useState<ModuleResult<T[number]>[]>(() =>
    initializeResults(moduleSpecs),
  )
  const [isLoading, setIsLoading] = useState(true)

  // Reset and reinitialize when moduleSpecs change
  useEffect(() => {
    if (skip) return
    // Reset the processed modules tracker
    processedModules.current = new Set()

    // Initialize results with proper structure
    setResults(initializeResults(moduleSpecs))
  }, [JSON.stringify(moduleSpecs), skip])

  const loadModule = async (
    remote: string,
    module: string,
    addon: string,
    fallback: T[number] | undefined,
    minVersion?: string,
  ) => {
    try {
      const result = await loadRemote<{ default: T[number] }>(`${remote}/${module}`, {
        from: 'runtime',
      })
      updateResultWithLoaded(addon, remote, module, result?.default || fallback, minVersion)
    } catch (error) {
      console.error('Error loading remote module', remote, module, error)
      throw error
    }
  }

  // Load modules when remotes are initialized
  useEffect(() => {
    if (skip) return

    console.log('loading modules')

    const promises: Promise<void>[] = []
    moduleSpecs.forEach((spec, index) => {
      const { addon, remote, module, fallback, minVersion } = spec

      if (!addon || !remote || !module) return

      // Create a unique key for this module
      const moduleKey = `${addon}/${remote}/${module}`

      // Skip if already processed
      if (processedModules.current.has(moduleKey)) return

      // Check if this module is already loaded in our results
      if (results[index]?.[1]?.isLoaded) {
        processedModules.current.add(moduleKey)
        return
      }

      // Mark as processed
      processedModules.current.add(moduleKey)

      const addonInfo = modules.find((m) => m.addonName === addon)

      // Handle missing addon
      if (!addonInfo) {
        console.log('Addon not found', { addon, remote, module })
        return
      }

      // Check version requirements
      if (minVersion && !semver.gte(addonInfo.addonVersion, minVersion)) {
        updateResultWithOutdated(
          index,
          addon,
          remote,
          module,
          fallback,
          minVersion,
          addonInfo.addonVersion,
        )
        return
      }

      // Check if module exists
      if (!addonInfo.modules[remote]) {
        console.log('Module not found', { addon, remote, module })
        return
      }

      promises.push(loadModule(remote, module, addon, fallback, minVersion))
    })

    // Wait for all promises to resolve
    setIsLoading(true)
    Promise.all(promises)
      .then(() => {
        // all modules loaded
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error loading modules', error)
        setIsLoading(false)
      })
  }, [skip, modules, JSON.stringify(moduleSpecs)])

  // Helper function to initialize results
  function initializeResults(specs: ModuleSpec<T[number]>[]): ModuleResult<T[number]>[] {
    return specs.map(
      ({ addon = '', remote = '', module = '', fallback, minVersion }): ModuleResult<T[number]> => [
        fallback as T[number],
        {
          isLoaded: false,
          addon,
          remote,
          module,
          minVersion,
          outdated: undefined,
        },
      ],
    )
  }

  // Helper to update a result with outdated status
  function updateResultWithOutdated(
    index: number,
    addon: string,
    remote: string,
    module: string,
    fallback: T[number] | undefined,
    requiredVersion: string,
    currentVersion: string,
  ) {
    setResults((prev) => {
      const updated = [...prev]
      if (index >= 0 && index < updated.length) {
        updated[index] = [
          fallback,
          {
            isLoaded: false,
            addon,
            remote,
            module,
            minVersion: requiredVersion,
            outdated: {
              current: currentVersion,
              required: requiredVersion,
            },
          },
        ]
      }
      return updated
    })
  }

  // Helper to update a result when module is loaded
  function updateResultWithLoaded(
    addon: string,
    remote: string,
    module: string,
    loadedModule: T[number] | undefined,
    minVersion?: string,
  ) {
    setResults((prev) => {
      const updated = [...prev]
      // Find the corresponding module spec
      const index = moduleSpecs.findIndex(
        (spec) => spec.addon === addon && spec.remote === remote && spec.module === module,
      )

      if (index >= 0 && index < updated.length) {
        updated[index] = [
          loadedModule,
          {
            isLoaded: true,
            addon,
            remote,
            module,
            minVersion,
            outdated: undefined,
          },
        ]
      }
      return updated
    })
  }

  return { modules: results, isLoading }
}

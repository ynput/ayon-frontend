// The URI is a unique AYON ID for entities and settings paths
// Entity: ayon+entity://project_name/shots/000_logo/000_0010?task=lighting
// Settings: ayon+settings://maya/ext_mapping/0/name

// Components can update the URI when changing context, like opening the details panel or navigating to a settings page
// Components state should not be directly synced to the URI, they should only read the URI on mount to set initial state

import { createContext, useContext, useEffect, ReactNode, FC, useCallback, useState } from 'react'
import { buildEntityUri, parseUri } from '../util'
import { ResolvedUriModel, useResolveUrisMutation } from '@shared/api'

export const URL_PARAM_ID = 'uri'

type SetEntityUriFunc = ({
  projectName,
  folderPath,
  taskName,
  productName,
  versionName,
}: {
  projectName: string
  folderPath: string
  taskName?: string
  productName?: string
  versionName?: string
}) => void

export type EntityUri = {
  projectName: string
  entityType: 'task' | 'folder' | 'product' | 'version'
  folderPath: string
  taskName?: string
  productName?: string
  versionName?: string
}

export type SettingsUri = {
  addonName: string
  addonVersion: string
  settingsPath: string[]
  site: string | undefined
  project: string | undefined
}

interface URIContextValue {
  uri: string
  uriType: 'settings' | 'entity' | undefined
  entity?: EntityUri
  settings?: SettingsUri
  setUri: (uri: string) => void
  setEntityUri: SetEntityUriFunc
  getUriEntities: () => Promise<ResolvedUriModel[]>
}

interface URIProviderProps {
  children: ReactNode
}

const URIContext = createContext<URIContextValue | undefined>(undefined)

const URIProvider: FC<URIProviderProps> = ({ children }) => {
  const pathname = location.pathname

  const [uri, setUri] = useState('')

  // when the scope is outside settings and project, set uri to null
  const scopes = ['projects', 'settings', 'dashboard/tasks']
  useEffect(() => {
    const matchingScope = scopes.some((scope) => pathname.startsWith(`/${scope}`))

    if (!matchingScope) {
      setUri('')
    }
  }, [pathname, setUri])

  const { type: uriType, entity, settings } = parseUri(uri)

  // helper function to set an entity URI
  const setEntityUri = useCallback<SetEntityUriFunc>(
    ({ projectName, folderPath, taskName, productName, versionName }) => {
      const uri = buildEntityUri({ projectName, folderPath, taskName, productName, versionName })
      setUri(uri)
    },
    [setUri],
  )

  // helper function to get entity ids from URI so that we can actually do something with it
  const [resolveUris] = useResolveUrisMutation()
  const getUriEntities = useCallback(async () => {
    if (uriType !== 'entity' || !uri) return []

    try {
      const entities = await resolveUris({ resolveRequestModel: { uris: [uri] } }).unwrap()
      // we could set more detailed entity info here if needed
      // for now we just log it
      console.log('Resolved entity from URI:', entities)

      return entities
    } catch (error) {
      console.warn('Failed to resolve URI:', error)
      return []
    }
  }, [resolveUris, uri, uriType])

  const contextValue: URIContextValue = {
    uri,
    uriType,
    entity,
    settings,
    setUri,
    setEntityUri,
    getUriEntities,
  }

  return <URIContext.Provider value={contextValue}>{children}</URIContext.Provider>
}

const useURIContext = (): URIContextValue => {
  const context = useContext(URIContext)
  if (context === undefined) {
    throw new Error('useURIContext must be used within a URIProvider')
  }
  return context
}

export { URIProvider, useURIContext }

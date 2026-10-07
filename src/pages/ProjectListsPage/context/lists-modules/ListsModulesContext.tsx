import { useLoadModule } from '@shared/hooks'
import { afterStartup } from '@shared/util'
import React, { ReactNode, FC, useCallback, useEffect, useState } from 'react'
import type { ListsAttributesContextValue } from '../lists-attributes/ListsAttributesContext'
import { ConfirmDeleteOptions } from '@shared/util'
import { TableSettingsFallback } from '@shared/components'
import { GuestAccessFallback, ListAccessFallback } from '../../components/ListAccessForm'
import { ListsModuleContext } from './ListsModulesContextInstance'

interface ListsAttributeSettingsFallbackProps {
  listAttributes: ListsAttributesContextValue['listAttributes']
  entityAttribFields: ListsAttributesContextValue['entityAttribFields']
  isLoadingNewList: ListsAttributesContextValue['isLoadingNewList']
  isUpdating: ListsAttributesContextValue['isUpdating']
  requiredVersion: string | undefined
  updateAttributes: ListsAttributesContextValue['updateAttributes']
  onGoTo: (name: string) => void
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
  confirmDelete?: (options: ConfirmDeleteOptions) => void
}

const ListsAttributeSettingsFallback: FC<ListsAttributeSettingsFallbackProps> = ({
  requiredVersion,
}) => (
  <TableSettingsFallback
    feature={'listAttributes'}
    requiredVersion={requiredVersion}
    button={{
      label: 'Add attribute',
    }}
  />
)

export interface ListsModuleContextType {
  ListsAttributesSettings: typeof ListsAttributeSettingsFallback
  ListAccess: typeof ListAccessFallback
  GuestAccess: typeof GuestAccessFallback
  requiredVersion: {
    settings: string | undefined
    access: string | undefined
    guestAccess: string | undefined
  }
  isLoading: {
    access: boolean
    guestAccess: boolean
  }
  // load the modules now (they are otherwise loaded once the page has loaded)
  requestModules: () => void
}

interface ListsModuleProviderProps {
  children: ReactNode
}

export const ListsModuleProvider: React.FC<ListsModuleProviderProps> = ({ children }) => {
  // the modules are only used in the access and settings panels, and the review module is large,
  // so they load once the page has loaded, or as soon as a panel that uses them mounts
  const [shouldLoad, setShouldLoad] = useState(false)
  const requestModules = useCallback(() => setShouldLoad(true), [])
  useEffect(() => {
    if (shouldLoad) return
    return afterStartup(requestModules)
  }, [shouldLoad, requestModules])
  const defer = !shouldLoad

  const [ListsAttributesSettings, { outdated: attributeSettingsOutdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListsAttributesSettings',
    fallback: ListsAttributeSettingsFallback,
    minVersion: '1.0.5',
    defer,
  })

  const [ListAccess, { outdated: accessOutdated, isLoading: isLoadingAccess }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListAccess',
    fallback: ListAccessFallback,
    minVersion: '1.2.4',
    defer,
  })

  const [GuestAccess, { outdated: guestAccessOutdated, isLoading: isLoadingGuestAccess }] =
    useLoadModule({
      addon: 'review',
      remote: 'review',
      module: 'GuestAccess',
      fallback: GuestAccessFallback,
      minVersion: '0.0.8',
      defer,
    })

  const value = {
    ListsAttributesSettings,
    ListAccess,
    GuestAccess,
    requiredVersion: {
      settings: attributeSettingsOutdated?.required,
      access: accessOutdated?.required,
      guestAccess: guestAccessOutdated?.required,
    },
    isLoading: {
      access: isLoadingAccess,
      guestAccess: isLoadingGuestAccess,
    },
    requestModules,
  }

  return <ListsModuleContext.Provider value={value}>{children}</ListsModuleContext.Provider>
}

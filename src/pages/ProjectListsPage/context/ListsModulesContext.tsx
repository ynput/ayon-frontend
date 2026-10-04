import { useLoadModule } from '@shared/hooks'
import React, { ReactNode, FC } from 'react'
import { ListsAttributesContextValue } from './ListsAttributesContext'
import { ConfirmDeleteOptions } from '@shared/util'
import { TableSettingsFallback } from '@shared/components'
import { GuestAccessFallback, ListAccessFallback } from '../components/ListAccessForm'
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
}

interface ListsModuleProviderProps {
  children: ReactNode
}

export const ListsModuleProvider: React.FC<ListsModuleProviderProps> = ({ children }) => {
  const [ListsAttributesSettings, { outdated: attributeSettingsOutdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListsAttributesSettings',
    fallback: ListsAttributeSettingsFallback,
    minVersion: '1.0.5',
  })

  const [ListAccess, { outdated: accessOutdated, isLoading: isLoadingAccess }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListAccess',
    fallback: ListAccessFallback,
    minVersion: '1.2.4',
  })

  const [GuestAccess, { outdated: guestAccessOutdated, isLoading: isLoadingGuestAccess }] =
    useLoadModule({
      addon: 'review',
      remote: 'review',
      module: 'GuestAccess',
      fallback: GuestAccessFallback,
      minVersion: '0.0.8',
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
  }

  return <ListsModuleContext.Provider value={value}>{children}</ListsModuleContext.Provider>
}

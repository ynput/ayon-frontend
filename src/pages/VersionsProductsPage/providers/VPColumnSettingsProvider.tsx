import { FC } from 'react'
import { ColumnSettingsProvider, ColumnDndProvider } from '@shared/containers'
import { useVPViewsContext } from '../context/VPViewsContextInstance'
import { DEFAULT_COLUMNS_VERSION } from '@pages/ProjectsPage/constants'
import { VP_COLUMN_ID_ALIASES } from '../components/VPTableSettings/VPTableSettingsHelpers'

interface VPColumnSettingsProviderProps {
  children: React.ReactNode
}

export const DEFAULT_COLUMN_VISIBILITY = DEFAULT_COLUMNS_VERSION

export const VPColumnSettingsProvider: FC<VPColumnSettingsProviderProps> = ({ children }) => {
  const { columns, onUpdateColumns } = useVPViewsContext()

  return (
    <ColumnSettingsProvider
      config={columns}
      onChange={onUpdateColumns}
      defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
      columnIdAliases={VP_COLUMN_ID_ALIASES}
    >
      <ColumnDndProvider>{children}</ColumnDndProvider>
    </ColumnSettingsProvider>
  )
}

import { FC } from 'react'
import { ColumnSettingsProvider, ColumnDndProvider, useViewLayoutId } from '@shared/containers'
import { useVPViewsContext } from '../context/VPViewsContext'
import { DEFAULT_COLUMNS_VERSION } from '@pages/ProjectsPage/constants'

interface VPColumnSettingsProviderProps {
  children: React.ReactNode
}

export const DEFAULT_COLUMN_VISIBILITY = DEFAULT_COLUMNS_VERSION

export const VPColumnSettingsProvider: FC<VPColumnSettingsProviderProps> = ({ children }) => {
  const { columns, onUpdateColumns } = useVPViewsContext()
  const layoutId = useViewLayoutId()

  return (
    <ColumnSettingsProvider
      config={columns}
      onChange={onUpdateColumns}
      defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
      layoutId={layoutId}
    >
      <ColumnDndProvider>{children}</ColumnDndProvider>
    </ColumnSettingsProvider>
  )
}

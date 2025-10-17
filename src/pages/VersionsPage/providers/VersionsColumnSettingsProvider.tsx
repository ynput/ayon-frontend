import { FC } from 'react'
import { ColumnsConfig, ColumnSettingsProvider } from '@shared/containers'

interface VersionsColumnSettingsProviderProps {
  children: React.ReactNode
  columns: ColumnsConfig
  onUpdateColumns: (columns: ColumnsConfig, allColumnIds?: string[] | undefined) => void
}

export const VersionsColumnSettingsProvider: FC<VersionsColumnSettingsProviderProps> = ({
  children,
  columns,
  onUpdateColumns,
}) => {
  return (
    <ColumnSettingsProvider config={columns} onChange={onUpdateColumns}>
      {children}
    </ColumnSettingsProvider>
  )
}

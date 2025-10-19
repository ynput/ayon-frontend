import { FC } from 'react'
import { ColumnSettingsProvider, useVersionsViewSettings } from '@shared/containers'

interface VersionsColumnSettingsProviderProps {
  children: React.ReactNode
}

export const VersionsColumnSettingsProvider: FC<VersionsColumnSettingsProviderProps> = ({
  children,
}) => {
  const { columns, onUpdateColumns } = useVersionsViewSettings()

  return (
    <ColumnSettingsProvider config={columns} onChange={onUpdateColumns}>
      {children}
    </ColumnSettingsProvider>
  )
}

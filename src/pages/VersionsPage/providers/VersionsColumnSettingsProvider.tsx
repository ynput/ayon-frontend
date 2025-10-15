import { FC } from 'react'
import { ColumnSettingsProvider, useOverviewViewSettings } from '@shared/containers'

interface VersionsColumnSettingsProviderProps {
  children: React.ReactNode
}

export const VersionsColumnSettingsProvider: FC<VersionsColumnSettingsProviderProps> = ({
  children,
}) => {
  // TODO replace with versions settings
  const { columns, onUpdateColumns } = useOverviewViewSettings()

  return (
    <ColumnSettingsProvider config={columns} onChange={onUpdateColumns}>
      {children}
    </ColumnSettingsProvider>
  )
}

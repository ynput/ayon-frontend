import { FC } from 'react'
import { ColumnSettingsProvider } from '@shared/containers'
import { useVersionsViewsContext } from '../context/VersionsViewsContext'

interface VersionsColumnSettingsProviderProps {
  children: React.ReactNode
}

export const VersionsColumnSettingsProvider: FC<VersionsColumnSettingsProviderProps> = ({
  children,
}) => {
  const { columns, onUpdateColumns } = useVersionsViewsContext()

  return (
    <ColumnSettingsProvider config={columns} onChange={onUpdateColumns}>
      {children}
    </ColumnSettingsProvider>
  )
}

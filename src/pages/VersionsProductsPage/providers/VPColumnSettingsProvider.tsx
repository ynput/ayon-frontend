import { FC } from 'react'
import { ColumnSettingsProvider } from '@shared/containers'
import { useVPViewsContext } from '../context/VPViewsContext'

interface VPColumnSettingsProviderProps {
  children: React.ReactNode
}

export const VPColumnSettingsProvider: FC<VPColumnSettingsProviderProps> = ({ children }) => {
  const { columns, onUpdateColumns } = useVPViewsContext()

  return (
    <ColumnSettingsProvider config={columns} onChange={onUpdateColumns}>
      {children}
    </ColumnSettingsProvider>
  )
}

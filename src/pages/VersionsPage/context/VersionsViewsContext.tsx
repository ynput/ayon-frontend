import { useVersionsViewSettings, VersionsViewSettingsReturn } from '@shared/containers'
import { createContext, FC, ReactNode, useContext } from 'react'

interface VersionsViewsContextValue extends VersionsViewSettingsReturn {}

const VersionsViewsContext = createContext<VersionsViewsContextValue | null>(null)

export const useVersionsViewsContext = () => {
  const context = useContext(VersionsViewsContext)
  if (!context) {
    throw new Error('useVersionsViewsContext must be used within VersionsDataProvider')
  }
  return context
}

interface VersionsViewsProviderProps {
  children: ReactNode
}

export const VersionsViewsProvider: FC<VersionsViewsProviderProps> = ({ children }) => {
  const config = useVersionsViewSettings()

  return <VersionsViewsContext.Provider value={config}>{children}</VersionsViewsContext.Provider>
}

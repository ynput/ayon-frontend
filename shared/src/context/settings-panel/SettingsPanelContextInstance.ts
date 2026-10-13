import { createContext, useContext } from 'react'
import type { SettingsPanelContextType } from './SettingsPanelContext'

export const SettingsPanelContext = createContext<SettingsPanelContextType | undefined>(undefined)

export const useSettingsPanel = (): SettingsPanelContextType => {
  const context = useContext(SettingsPanelContext)
  if (context === undefined) {
    throw new Error('useSettingsPanel must be used within a SettingsPanelProvider')
  }
  return context
}

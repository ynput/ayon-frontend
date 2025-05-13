import { createContext, useState, useContext, FC, ReactNode } from 'react'

export type SettingField = 'columns' | string

interface SettingsPanelContextType {
  isPanelOpen: boolean
  selectedSetting: SettingField | null
  openPanel: () => void
  closePanel: () => void
  togglePanel: (setting?: SettingField | null) => void
  selectSetting: (setting: SettingField | null) => void
  backToMainMenu: () => void
}

const SettingsPanelContext = createContext<SettingsPanelContextType | undefined>(undefined)

interface SettingsPanelProviderProps {
  children: ReactNode
}

export const SettingsPanelProvider: FC<SettingsPanelProviderProps> = ({ children }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedSetting, setSelectedSetting] = useState<SettingField | null>(null)

  const openPanel = () => {
    setIsPanelOpen(true)
  }

  const closePanel = () => {
    setIsPanelOpen(false)
  }

  const togglePanel: SettingsPanelContextType['togglePanel'] = (setting) => {
    setIsPanelOpen((prev) => !prev)

    // If a setting is provided, select it
    if (setting && !isPanelOpen) {
      setSelectedSetting(setting)
    } else {
      setSelectedSetting(null)
    }
  }

  const selectSetting = (setting: SettingField | null) => {
    setSelectedSetting(setting)
  }

  const backToMainMenu = () => {
    setSelectedSetting(null)
  }

  return (
    <SettingsPanelContext.Provider
      value={{
        isPanelOpen,
        selectedSetting,
        openPanel,
        closePanel,
        togglePanel,
        selectSetting,
        backToMainMenu,
      }}
    >
      {children}
    </SettingsPanelContext.Provider>
  )
}

export const useSettingsPanel = (): SettingsPanelContextType => {
  const context = useContext(SettingsPanelContext)
  if (context === undefined) {
    throw new Error('useSettingsPanel must be used within a SettingsPanelProvider')
  }
  return context
}

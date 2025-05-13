import { createContext, useState, useContext, FC, ReactNode, Dispatch } from 'react'

export type SettingField = 'columns' | string
export type SettingHighlightedId = string | null
interface SettingsPanelContextType {
  isPanelOpen: boolean
  selectedSetting: SettingField | null
  highlightedSetting: SettingHighlightedId
  setHighlightedSetting: Dispatch<React.SetStateAction<SettingHighlightedId>>
  openPanel: () => void
  closePanel: () => void
  togglePanel: (setting?: SettingField | null, highlighted?: SettingHighlightedId) => void
  selectSetting: (setting: SettingField | null, highlighted?: SettingHighlightedId) => void
  backToMainMenu: () => void
}

const SettingsPanelContext = createContext<SettingsPanelContextType | undefined>(undefined)

interface SettingsPanelProviderProps {
  children: ReactNode
}

export const SettingsPanelProvider: FC<SettingsPanelProviderProps> = ({ children }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedSetting, setSelectedSetting] = useState<SettingField | null>(null)
  // highlighted setting item and scroll to it (setting panel must handle it itself)
  const [highlightedSetting, setHighlightedSetting] = useState<SettingHighlightedId>(null)

  const openPanel = () => {
    setIsPanelOpen(true)
    setSelectedSetting(null)
  }

  const closePanel = () => {
    setIsPanelOpen(false)
    setSelectedSetting(null)
  }

  const togglePanel: SettingsPanelContextType['togglePanel'] = (setting, highlighted = null) => {
    setIsPanelOpen((prev) => !prev)

    // If a setting is provided, select it
    if (setting && !isPanelOpen) {
      setSelectedSetting(setting)
      setHighlightedSetting(highlighted)
    } else {
      setSelectedSetting(null)
      setHighlightedSetting(null)
    }
  }

  const selectSetting: SettingsPanelContextType['selectSetting'] = (
    setting,
    highlighted = null,
  ) => {
    setSelectedSetting(setting)
    setHighlightedSetting(highlighted)
  }

  const backToMainMenu = () => {
    setSelectedSetting(null)
    setHighlightedSetting(null)
  }

  return (
    <SettingsPanelContext.Provider
      value={{
        isPanelOpen,
        selectedSetting,
        highlightedSetting,
        setHighlightedSetting,
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

import { Button, Icon } from '@ynput/ayon-react-components'
import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import { SettingField, useSettingsPanel } from '@shared/context'
import RowHeightSettings from '@shared/components/ProjectTableSettings/RowHeightSettings'

// Side panel styled components
const SidePanel = styled.div<{ open: boolean }>`
  height: 100%;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 4px;
  z-index: 10;
  display: flex;
  flex-direction: column;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 34px;
  padding: 0px 4px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);

  h3 {
    margin-left: 4px;
    padding: 0;
  }
`

const ToolButton = styled(Button)`
  padding: 4px !important;
`

const PanelTitle = styled.h3`
  margin: 0;
  flex: 1;
`

const PanelContent = styled.div`
  padding: 8px;
  flex: 1;
  overflow-y: auto;
`

export const SettingOption = styled(Button)`
  width: 100%;
  justify-content: flex-start;
  margin-bottom: 8px;
  text-align: left;
  display: flex;
  gap: var(--base-gap-small);
  padding-right: var(--padding-s);

  .title {
    flex: 1;
  }

  .preview,
  .arrow {
    color: var(--md-sys-color-outline);
  }
`

export interface SettingConfig {
  id: SettingField
  title: string
  component: ReactNode
  icon?: string
  preview?: string | number
}

export interface SettingsPanelProps {
  settings: SettingConfig[]
}

export const SettingsPanel: FC<SettingsPanelProps> = ({ settings }) => {
  const { isPanelOpen, selectedSetting, closePanel, backToMainMenu, selectSetting } =
    useSettingsPanel()

  const getPanelTitle = () => {
    if (!selectedSetting) return 'Settings'
    const setting = settings.find((s) => s.id === selectedSetting)
    return setting?.title || 'Settings'
  }

  const renderSettingContent = () => {
    if (!selectedSetting) {
      // Render main menu
      return (
        <>
          {settings.map((setting) => (
            <SettingOption
              key={setting.id}
              onClick={() => selectSetting(setting.id)}
              variant="text"
            >
              {setting.icon && <Icon icon={setting.icon} />}
              <span className="title">{setting.title}</span>
              {!!setting.preview?.toString() && <span className="preview">{setting.preview}</span>}
              <Icon icon="chevron_right" className="arrow" />
            </SettingOption>
          ))}
        </>
      )
    }

    const setting = settings.find((s) => s.id === selectedSetting)
    return setting?.component
  }

  return (
    <SidePanel open={isPanelOpen}>
      <PanelHeader>
        {selectedSetting && settings.length > 1 && (
          <ToolButton variant="text" icon="arrow_back" onClick={backToMainMenu} />
        )}
        <PanelTitle>{getPanelTitle()}</PanelTitle>
        <ToolButton variant="text" icon="close" onClick={closePanel} />
      </PanelHeader>
      <PanelContent>
        {renderSettingContent()}
        <RowHeightSettings />
      </PanelContent>
    </SidePanel>
  )
}

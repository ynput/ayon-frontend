import { Button, Icon } from '@ynput/ayon-react-components'
import { FC, Fragment, ReactNode } from 'react'
import styled from 'styled-components'
import { SettingField, useSettingsPanel } from '@shared/context'

// Side panel styled components
const SidePanel = styled.div<{ open: boolean }>`
  height: 100%;
  /* fixed floor so the panel doesn't resize as its content changes */
  min-width: 260px;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 4px;
  /* firefox repaints child borders unreliably inside a rounded overflow clip */
  box-shadow: inset 1px 0 0 var(--md-sys-color-outline-variant);
  z-index: 10;
  display: flex;
  flex-direction: column;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 34px;
  flex: 0 0 auto;
  padding: 0px 4px;
  box-shadow: inset 0 -1px 0 var(--md-sys-color-outline-variant);

  h3 {
    margin-left: 4px;
    padding: 0;
    white-space: nowrap;
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
  padding-left: var(--padding-m);

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
  title?: string
  component: ReactNode
  icon?: string
  preview?: string | number
  headerActions?: ReactNode
  // replaces the title and the header actions, keeping the row height
  headerContent?: ReactNode
}

export interface SettingsPanelProps {
  settings: SettingConfig[]
  order?: string[]
}

export const SettingsPanel: FC<SettingsPanelProps> = ({ settings, order }) => {
  const { isPanelOpen, selectedSetting, closePanel, backToMainMenu, selectSetting } =
    useSettingsPanel()

  const getPanelTitle = () => {
    if (!selectedSetting) return 'Settings'
    const setting = settings.find((s) => s.id === selectedSetting)
    return setting?.title || 'Settings'
  }

  const sortedSettings = order
    ? settings.toSorted((a, b) => {
        const aIndex = a.id ? order.indexOf(a.id) : -1
        const bIndex = b.id ? order.indexOf(b.id) : -1
        if (aIndex === -1 && bIndex === -1) return 0
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
    : settings

  const selectedConfig = settings.find((s) => s.id === selectedSetting)

  const renderSettingContent = () => {
    if (!selectedSetting) {
      // Render main menu
      return (
        <>
          {sortedSettings.map((setting, i) =>
            setting.title ? (
              <SettingOption
                key={setting.id}
                onClick={() => selectSetting(setting.id)}
                variant="text"
                className="setting-option"
              >
                {setting.icon && <Icon icon={setting.icon} />}
                <span className="title">{setting.title}</span>
                {!!setting.preview?.toString() && (
                  <span className="preview">{setting.preview}</span>
                )}
                <Icon icon="chevron_right" className="arrow" />
              </SettingOption>
            ) : (
              <Fragment key={setting.id}>{setting.component}</Fragment>
            ),
          )}
        </>
      )
    }

    const setting = settings.find((s) => s.id === selectedSetting)
    return setting?.component
  }

  return (
    <SidePanel open={isPanelOpen}>
      <PanelHeader>
        {selectedSetting && (
          <ToolButton variant="text" icon="arrow_back" onClick={backToMainMenu} />
        )}
        {selectedConfig?.headerContent ?? (
          <>
            <PanelTitle>{getPanelTitle()}</PanelTitle>
            {selectedConfig?.headerActions}
          </>
        )}
        <ToolButton variant="text" icon="close" onClick={closePanel} />
      </PanelHeader>
      <PanelContent>{renderSettingContent()}</PanelContent>
    </SidePanel>
  )
}

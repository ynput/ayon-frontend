import styled from 'styled-components'
import { Section, ScrollPanel, theme } from '@ynput/ayon-react-components'

export const SettingsFormSection = styled(Section)`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: var(--padding-m);
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);
`

export const SettingsFormTitle = styled.h2`
  ${theme.labelLarge}
  margin: 0;
  padding-left: 4px;
`

export const SettingsFormScrollPanel = styled(ScrollPanel)`
  flex: 1;
  min-height: 0;
  padding: var(--padding-m);
  overflow: auto;
`

export const SettingsFormContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`

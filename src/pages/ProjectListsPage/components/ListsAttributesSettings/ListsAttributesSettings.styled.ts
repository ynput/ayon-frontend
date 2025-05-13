import { SettingsPanelItemTemplate as SettingsPanelItemTemplateComponent } from '@shared/components'
import styled from 'styled-components'

export const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  height: 100%;
  overflow: hidden;
`
export const Items = styled.ul`
  display: flex;
  flex-direction: column;
  list-style-type: none;
  margin: 0;
  padding: 0;
`

export const SettingsPanelItemTemplate = styled(SettingsPanelItemTemplateComponent)`
  cursor: pointer;

  /* hide edit icon by default */
  [icon='edit'] {
    opacity: 0;
    margin-right: 4px;
  }
  &:hover {
    /* show edit icon on hover */
    [icon='edit'] {
      opacity: 1;
    }
  }
`

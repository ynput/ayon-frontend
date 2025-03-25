import { Button } from '@ynput/ayon-react-components'
import { DataTable as BaseDataTable } from 'primereact/datatable'
import styled from 'styled-components'

export const StyledHeader = styled.p`
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  margin: 0;
  padding: 4px 0;
`

export const DataColumn = styled.div`
  display: flex;
  height: 24px;
  align-items: center;
  gap: var(--base-gap-large);
  .partial-match {
    color: var(--md-ref-palette-neutral-variant60);
  }
  button {
    visibility: hidden;
    .shortcut {
      font-size: 11px;
      line-height: 16px;
      font-weight: 700;
      padding: 1px 4px;
      vertical-align: middle;
      background-color: var(--md-sys-color-primary-container);
      border-radius: var(--border-radius-m);
    }
  }
  &.hovering {
    button {
      visibility: visible;
    }
  }
`
export const ActionButton = styled(Button)`
  padding: 0;
  &.hasIcon {
    padding: 2px 4px;
  }
  .icon {
    height: 20px;
    width: 20px;
  }
`
export const CompactPlaceholder = styled.div`
  height: 100%;
  p {
    margin: 0;
    padding: var(--padding-m);
    color: var(--md-ref-palette-neutral-variant60);
  }
`

export const DataTable = styled(BaseDataTable)`
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  overflow: hidden;
  &.fullBorderRadius {
    border-radius: 4px;
  }
`

export const AccessGroupsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`
export const ProjectUserAccessUserListWrapper = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-low);
  border-radius: 4px;
`

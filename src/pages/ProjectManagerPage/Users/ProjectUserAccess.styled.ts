import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { Button } from '@ynput/ayon-react-components'
import { DataTable as BaseDataTable} from 'primereact/datatable'
import styled from 'styled-components'

export const StyledEmptyPlaceholder = styled(EmptyPlaceholder)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
  position: relative;
  max-width: 100%;
  overflow: hidden;
  top: 0;
  left: 0;
  transform: none;
  gap: 8px;
  .icon {
    font-size: 34px;
  }
  h3 {
    font-size: 18px;
  }
`
export const StyledEmptyPlaceholderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  position: relative;
  height: 100%;
  border-radius: var(--border-radius-m);

  background: var(--md-sys-color-surface-container-low);
  .header {
    margin: 0;
    padding: 9.4px 8px;
    text-transform: capitalize;
  }
`
export const StyledHeader = styled.p`
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  margin: 8px 0;
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
  .p-datatable-wrapper {
    border-radius: inherit;
  }
`
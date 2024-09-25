import {
  InputText as BaseInputText,
  InputColor as BaseInputColor,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'

const centeredContentFlexColumn = `
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`

const centeredContentFlexRow = `
  display: flex;
  align-items: center;
  gap: 8px;
`

export const AttributeDropdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  gap: 4px;
`

export const AttributeDropdownItemWrapper = styled.div`
  justify-content: stretch;
  border-radius: 4px;
  overflow: hidden;
`

export const AttributeDropdownItemHeader = styled.div`
  ${centeredContentFlexRow}
  cursor: unset;
  user-select: none;
  padding: 8px;
  height: 36px;
  font-size: 14px;
  line-height: 17px;
  background-color: var(--md-sys-color-surface-container-high);
  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
    .icon.toggle-expand {
      visibility: visible;
    }
  }
  .icon {
    width: 20px;
    height: 20px;
    &.actionable {
      cursor: pointer;
    }
    &.toggle-expand {
      visibility: hidden;
    }
  }
  &.collapsed {
    color: red;
    height: 0;
  }
  &.expanded {
    background-color: var(--md-sys-color-surface-container-highest);
    .icon.toggle-expand {
      visibility: visible;
    }
  }
  .label {
    flex-grow: 1;
  }
`

export const AttributeDropdownItemBodyExpander = styled.div`
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows .75s;
  &.expanded {
    grid-template-rows: 1fr;
  }
`

export const AttributeDropdownItemBody = styled.div`
  ${centeredContentFlexColumn}
  background-color: var(--md-sys-color-surface-container-high);
  align-items: stretch;
  padding: 0px 8px;
  min-height: 0;
  opacity: 0;
  transition: all .75s;
  &.expanded {
    opacity: 1;
    padding: 8px;
  }
`

export const Label = styled.div`
  user-select: none;
  width: 80px;
`

export const Row = styled.div`
  ${centeredContentFlexRow}
  &.footer{
    justify-content: space-between;
    padding: 0 8px;
  }
`

export const ActionWrapper = styled.div`
  ${centeredContentFlexRow}
  padding: 8px;
  gap: 4px;
  cursor: pointer;
  user-select: none;
`

export const InputText = styled(BaseInputText)`
  background-color: var(--md-sys-color-surface-container-low);
  border-color: var(--md-sys-color-outline-variant);
  width: 360px;
  padding: 4px 8px;
  &.compact {
    width: 312px;
  }
`

export const InputColor = styled(BaseInputColor)`
  width: 312px;
  input {
    width: 312px;
  }
`

export const MockInputColor = styled(InputText)`
  width: 312px;
  outline-width: 0;
  opacity: 0.75;
  cursor: pointer;
  input {
    width: 312px;
    &:focus {
      outline: none;
    }
  }
`
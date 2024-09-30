import {
  InputText as BaseInputText,
  IconSelect as BaseIconSelect,
  Button as BaseButton,
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
  &.dragged {
    opacity: 0
  }
`

export const AttributeDropdownItemHeader = styled.div`
  ${centeredContentFlexRow}
  cursor: pointer;
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
    &.draggable {
      cursor: grab;
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
  .spacer {
    flex-grow: 1;
  }
`

export const AttributeDropdownItemBodyExpander = styled.div`
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows 0.25s;
  &.expanded {
    grid-template-rows: 1fr;
  }
`

export const AttributeDropdownItemBody = styled.div`
  ${centeredContentFlexColumn}
  background-color: var(--md-sys-color-surface-container-high);
  align-items: stretch;
  padding: 0 8px;
  min-height: 0;
  transition: padding 0.25s;
  &.expanded {
    padding: 8px;
  }
`

export const Label = styled.div`
  user-select: none;
  min-width: 80px;
`

export const Row = styled.div`
  ${centeredContentFlexRow}
  &.footer {
    justify-content: space-between;
    padding: 0 8px;
  }
`

export const ActionWrapper = styled.div`
  ${centeredContentFlexRow}
  gap: 4px;
`

export const LabelColor = styled.div`
  border-radius: 4px;
  width: 14px;
  height: 14px;
`

export const IconSelect = styled(BaseIconSelect)`
  flex-grow: 1;
  button div {
    width: 100%;
  }
`

export const Button = styled(BaseButton)`
  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

export const InputText = styled(BaseInputText)`
  background-color: var(--md-sys-color-surface-container-low);
  border-color: var(--md-sys-color-outline-variant);
  flex-grow: 1;
  padding: 4px 8px;
`

export const ColorPicker = styled.div`
  position: relative;
  display: flex;
  flex-grow: 1;
  cursor: pointer;
  &.disabled {
    cursor: default;
    opacity: 0.75;
  }
  input {
    visibility: hidden;
  }
`
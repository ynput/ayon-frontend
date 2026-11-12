import {
  InputText as BaseInputText,
  IconSelect as BaseIconSelect,
  Button as BaseButton,
} from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

const centeredContentFlexColumn = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`

const centeredContentFlexRow = css`
  display: flex;
  align-items: center;
  gap: 8px;
`
const inputLikeColorsAndBorder = css`
  min-height: var(--base-input-size);
  max-height: var(--base-input-size);
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);
  border: 1px solid;
  border-color: var(--md-sys-color-outline-variant);

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }
`

export const EnumListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  gap: 4px;
`

export const EnumItemWrapper = styled.div`
  justify-content: stretch;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-high);
  &.dragged {
    opacity: 0;
  }
`

export const EnumItemHeader = styled.div`
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
    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
    .icon.toggle-expand {
      visibility: visible;
    }
  }
  .spacer {
    flex-grow: 1;
  }
`

export const EnumItemBodyExpander = styled.div`
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows 0.25s;
  &.expanded {
    grid-template-rows: 1fr;
  }
`

export const EnumItemBody = styled.div`
  ${centeredContentFlexColumn}
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
  width: 100%;
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

export const PlaceholderWrapper = styled.div`
  display: flex;
  justify-content: start;
  flex-grow: 1;
  gap: var(--base-gap-small);
  width: 100%;
`
export const Placeholder = styled.div`
  ${inputLikeColorsAndBorder}
  cursor: pointer;
  display: flex;
  justify-content: start;
  flex-grow: 1;
  align-items: center;
  width: 100%;
  padding-left: 8px;
  user-select: none;
`

export const ColorPicker = styled(Placeholder)`
  ${inputLikeColorsAndBorder}
  position: relative;
  cursor: pointer;
  &.active:hover {
    filter: brightness(1.4);
  }
  input {
    position: absolute;
    visibility: hidden;
  }
`

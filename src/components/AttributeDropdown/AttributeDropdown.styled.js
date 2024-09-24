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
  width: 480px;
`

export const AttributeDropdownItemHeader = styled.div`
  ${centeredContentFlexRow}
  cursor: unset;
  user-select: none;
  padding: 8px;
  height: 36px;
  font-size: 14px;
  line-height: 17px;
  background-color: var(--md-sys-color-surface-container-highest);
  .icon {
    width: 20px;
    height: 20px;
    &.actionable {
      cursor: pointer;
    }
  }
  .expanded {
    flex-grow: 1;
  }
`

export const AttributeDropdownItemBody = styled.div`
  ${centeredContentFlexColumn}
  align-items: stretch;
  padding: 8px;
  background-color: var(--md-sys-color-surface-container-high-dark);
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
  cursor: pointer;
  user-select: none;
`

export const InputText = styled(BaseInputText)`
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
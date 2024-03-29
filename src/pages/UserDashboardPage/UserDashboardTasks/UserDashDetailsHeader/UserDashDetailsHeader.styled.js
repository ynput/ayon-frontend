import styled from 'styled-components'
import StatusSelect from '/src/components/status/statusSelect'
import { OverflowField } from '@ynput/ayon-react-components'

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  z-index: 50;

  .thumbnail {
    width: 48px;
  }
`

export const Path = styled(OverflowField)`
  & > span {
    -webkit-transform: translate3d(0, 0, 0);
  }
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  overflow: hidden;

  h2 {
    margin: 0;
  }

  h3 {
    display: block;
    margin: 0;
    border: none;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const StatusAssigned = styled.div`
  display: flex;
  flex-direction: column;
`

export const ContentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;

  label {
    color: var(--md-sys-color-outline);
  }
`

export const LabelWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

export const TaskStatusSelect = styled(StatusSelect)`
  .status-field.value {
    position: relative;
    left: 1px;
    height: 28px;
    padding-right: 8px;
    width: calc(100% - 1px);
    margin-bottom: 2px;
  }
`

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: space-between;
`

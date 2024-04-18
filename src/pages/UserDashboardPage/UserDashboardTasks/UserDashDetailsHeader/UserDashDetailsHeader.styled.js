import styled from 'styled-components'
import StatusSelect from '/src/components/status/statusSelect'
import { Button, OverflowField, Section as SectionARC } from '@ynput/ayon-react-components'

export const Container = styled.div`
  position: relative;
`

export const SectionWrapper = styled(SectionARC)`
  padding: 8px;
  align-items: flex-start;
  gap: 8px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  flex: none;
  overflow: hidden;
`

export const CloseButton = styled(Button)`
  position: absolute;
  right: 4px;
  top: 4px;
  width: fit-content;
  z-index: 100;
`

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

export const Section = styled.div`
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

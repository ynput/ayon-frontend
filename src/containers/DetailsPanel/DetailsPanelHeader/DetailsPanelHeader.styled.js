import styled from 'styled-components'
import StatusSelect from '/src/components/status/statusSelect'
import {
  Button,
  OverflowField,
  Section as SectionARC,
  getShimmerStyles,
} from '@ynput/ayon-react-components'

export const Container = styled.div`
  position: relative;
`

export const SectionWrapper = styled(SectionARC)`
  padding: 8px;
  align-items: flex-start;
  gap: var(--base-gap-large);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  flex: none;
  overflow: hidden;
`

export const CloseButton = styled(Button)`
  position: absolute;
  right: 4px;
  top: 4px;
  width: fit-content;
  z-index: 50;
`

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  gap: var(--base-gap-large);
  z-index: 50;

  .thumbnail {
    width: 48px;
  }
`

export const Path = styled(OverflowField)`
  position: relative;

  &:hover {
    z-index: 100;
  }

  &.onClose {
    padding-right: 40px;
  }

  & > span {
    -webkit-transform: translate3d(0, 0, 0);
  }

  &.isLoading {
    overflow: hidden;
    border-radius: var(--border-radius-m);
    span {
      opacity: 0;
    }
    ${getShimmerStyles()}
  }
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  overflow: hidden;
  position: relative;
  border-radius: var(--border-radius-m);

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

  &.isLoading {
    width: 70%;
    ${getShimmerStyles()}

    h2, h3 {
      opacity: 0;
    }
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

  &.isLoading {
    ${getShimmerStyles()}
    border-radius: var(--border-radius-m);

    .button {
      opacity: 0;
    }
  }
`

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  justify-content: space-between;
`

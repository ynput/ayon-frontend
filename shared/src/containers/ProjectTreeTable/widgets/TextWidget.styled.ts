import styled from 'styled-components'
import { wrapMode } from './wrapMode'

export const StyledBaseTextWidget = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;

  display: flex;
  gap: 4px;

  &.markdown {
    white-space: normal;
    word-break: break-word;
    display: block;
    overflow: hidden;
    width: 100%;
    max-height: 100%;
  }

  &.regular {
    display: block;
  }

  ${wrapMode`
    &:not(.markdown) {
      white-space: normal;
      word-break: break-word;
      display: block;
      overflow: hidden;
      width: 100%;
      max-height: 100%;

      > .icon {
        margin-right: 4px;
      }
    }
  `}
`

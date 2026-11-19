import styled from 'styled-components'
import { wrapMode } from './wrapMode'

export const StyledBaseTextWidget = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;

  display: flex;
  gap: 4px;

  /* a compact row has room for one line: show the start of the text, cut with an ellipsis
     (the full text is in the hover preview) */
  &.markdown {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    align-self: center;
    white-space: normal;
    word-break: break-word;
    overflow: hidden;
    width: 100%;
  }

  &.regular {
    display: block;
  }

  /* taller rows wrap the text over the whole lines they fit */
  ${wrapMode`
    &.markdown {
      display: block;
      -webkit-line-clamp: none;
      align-self: flex-start;
      max-height: 100%;
      max-height: round(down, 100%, 1lh);
    }
  `}

  ${wrapMode`
    &:not(.markdown) {
      white-space: normal;
      word-break: break-word;
      display: block;
      overflow: hidden;
      width: 100%;
      max-height: 100%;
      max-height: round(down, 100%, 1lh);

      > .icon {
        margin-right: 4px;
      }
    }
  `}
`

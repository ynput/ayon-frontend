import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  min-width: 0;
`

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-height: 36px;
  padding: 4px 8px;
`

export const Title = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  user-select: none;
`

export const Menu = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  &:empty {
    display: none;
  }
`

// the search bar and the extra content bring their own padding: the tabs' own search bars
// (Activity, Subtasks) line up with their content below
export const SearchButton = styled(Button)`
  position: relative;

  &.hasIcon {
    padding: 4px;
  }

  /* filters are set while the bar is hidden */
  &.active::after {
    content: '';
    position: absolute;
    top: 2px;
    right: 2px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--md-sys-color-primary);
  }
`

export const Search = styled.div`
  &:empty,
  &.hidden {
    display: none;
  }
`

export const Extra = styled.div`
  &:empty {
    display: none;
  }
`

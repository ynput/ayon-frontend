import styled from 'styled-components'

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
export const Search = styled.div`
  &:empty {
    display: none;
  }
`

export const Extra = styled.div`
  &:empty {
    display: none;
  }
`

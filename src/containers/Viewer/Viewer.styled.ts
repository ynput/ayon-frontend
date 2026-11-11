import styled from 'styled-components'
import { Dropdown } from '@ynput/ayon-react-components'

// the player fills the dialog and is the theatre/fullscreen target
export const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-lowest);
`

// The host content in the player header, the clip on screen: folder / product / version, with the
// pickers. It looks like the comparison picker beside it when comparing (Review's), and like it,
// the names shorten when the header is narrow.
export const HeaderStart = styled.div`
  display: flex;
  align-items: center;
  gap: var(--padding-s);
  min-width: 0;
  height: 32px;
  padding: 2px var(--padding-s);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
  white-space: nowrap;

  & > * {
    flex-shrink: 0;
  }

  .name {
    flex-shrink: 1;
    min-width: 2.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* the player's header */
  @container clip-header (max-width: 1100px) {
    img {
      display: none;
    }
  }
`

export const HeaderDropdown = styled(Dropdown)`
  flex-shrink: 1;
  min-width: 3.5rem;
  height: 24px;

  & button {
    background-color: var(--md-sys-color-surface-container-low);

    & > div {
      border-color: var(--md-sys-color-surface-container-low);
      transition: none;
    }
  }

  &:hover button {
    background-color: var(--md-sys-color-surface-container);

    & > div {
      border-color: var(--md-sys-color-surface-container);
    }
  }

  /* version names are short: the folder and product shorten instead */
  &.version {
    flex-shrink: 0;
  }
`

export const HeaderEnd = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
`

// shown instead of the player when there is nothing it can play
export const EmptyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--padding-s);
`

export const EmptyBody = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
`

export const EmptySidebar = styled.div`
  width: 25%;
  min-width: 320px;
  padding: 0 var(--padding-s) var(--padding-s) 0;
`

export const Empty = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--padding-m);
`

export const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--base-gap-large);
  height: 100%;
  text-align: center;

  h2 {
    margin: 0;
  }
`

export const Sidebar = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

import styled from 'styled-components'

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

// the host content in the player header: path, product and version pickers
export const HeaderStart = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-width: 0;

  .path {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--md-sys-color-on-surface-variant);
  }

  .product-dropdown {
    width: unset;
    background-color: var(--md-sys-color-surface-container-highest);

    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
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

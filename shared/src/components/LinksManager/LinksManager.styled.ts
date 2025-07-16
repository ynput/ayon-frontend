import { InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  padding: var(--padding-m);
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-l);
  display: flex;
  flex-direction: column;
  max-height: 100%;
  overflow: hidden;
`

export const Header = styled.h4`
  margin: 0;
  padding: 0;
  flex-shrink: 0;

  color: var(--md-sys-color-outline);
`

export const LinksList = styled.ul`
  /* reset any defaults */
  list-style: none;
  padding: 0;
  margin: 0;

  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`

export const LinkItem = styled.li`
  /* reset any defaults */
  list-style: none;
  padding: 0;
  margin: 0;

  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  /* card styling */
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  padding: 4px 4px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  .label {
    flex: 1;
  }

  .remove {
    padding: 2px;

    .icon:not(:hover) {
      color: var(--md-sys-color-outline);
    }
  }
`

export const AddLinksContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: var(--padding-m);
`

export const Search = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  .icon {
    position: absolute;
    left: 4px;
  }
`

export const SearchInput = styled(InputText)`
  flex: 1;
  border: none;
  background-color: unset;
  padding-left: 28px;
`

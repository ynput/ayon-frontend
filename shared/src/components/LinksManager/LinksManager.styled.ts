import styled from 'styled-components'

export const Container = styled.div`
  padding: var(--padding-m);
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-l);
`

export const Header = styled.h4`
  margin: 0;
  padding: 0;

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

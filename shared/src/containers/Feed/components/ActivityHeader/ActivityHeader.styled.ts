import styled from 'styled-components'

export const Header = styled.header`
  display: flex;
  align-items: flex-end;
  gap: var(--base-gap-small);
  position: relative;
  padding: 0 4px;

  h5 {
    margin: 0;
    margin-left: 4px;
    font-weight: 800;
  }
`

export const Body = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  flex-wrap: wrap;
`

export const Reference = styled.li`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  padding: var(--padding-s) var(--padding-m);
  border-radius: var(--border-radius-m);
  border-radius: var(--border-radius-m);
  cursor: pointer;

  overflow: hidden;
  min-height: 30px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }
`

export const Text = styled.span`
  color: var(--md-sys-color-outline);
  white-space: nowrap;

  strong {
    font-weight: 800;
  }
`

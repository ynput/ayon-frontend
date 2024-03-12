import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);

  max-width: 800px;
  width: 100%;
  padding-top: 16px;

  overflow: hidden;
`

export const Header = styled.header`
  display: flex;
  gap: var(--base-gap-large);
  width: 100%;
`

export const All = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  overflow: auto;
  padding-bottom: 16px;
`

export const Installer = styled.div`
  width: 100%;
  display: flex;
  padding: var(--padding-s) var(--padding-m);
  justify-content: space-between;
  border-radius: var(--border-radius-m);
  align-items: center;

  &:hover {
    background-color: var(--md-sys-color-surface-container);
    svg {
      fill: var(--md-sys-color-on-surface);
    }
  }
`

export const Platforms = styled.div`
  display: flex;
  flex-direction: row-reverse;
  gap: var(--base-gap-small);

  svg {
    width: 16px;
    height: 16px;
    fill: var(--md-sys-color-outline);
  }
`

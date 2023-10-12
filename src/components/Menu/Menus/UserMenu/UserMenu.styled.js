import styled from 'styled-components'

export const UserMenu = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  border-radius: 8px;
  overflow: hidden;

  /* FIX: when new theme comes in we will use PANEL */
  background-color: var(--md-sys-color-surface-container-high);
`
// main content
export const Content = styled.div`
  display: flex;
  padding: 8px;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
`

// header
export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: stretch;
`

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  span {
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    line-height: inherit;
    user-select: text;
  }

  .error {
    color: var(--md-sys-color-error);
  }
`

export const Buttons = styled.div`
  display: flex;
  gap: 4px;

  /* FIX: until new buttons */
  button {
    padding: 6px 16px 6px 12px;
    max-height: unset;
  }
`

// footer
export const Footer = styled.footer`
  display: flex;
  padding: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-self: stretch;

  background-color: var(--md-sys-color-surface-container-low);
`

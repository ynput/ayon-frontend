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

// header
export const Header = styled.header`
  padding: 8px 8px 0px 16px;
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  align-self: stretch;
`

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 200px;
  min-width: 150px;

  span {
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    line-height: inherit;
    user-select: text;

    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .error {
    color: var(--md-sys-color-error);
  }
`

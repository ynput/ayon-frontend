import { Dialog, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const FriendlyDialog = styled(Dialog)`
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-xxl);
  max-height: 80%;

  p {
    margin: 0;
    margin-bottom: 16px;
  }

  .body {
    padding: 16px 32px;
    gap: var(--base-gap-large);
  }

  .note {
    color: var(--md-sys-color-outline);
    margin-top: 16px;
  }
`

export const Header = styled.h2`
  ${theme.headlineLarge}
  text-align: center;
  margin: 0;
`

export const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: var(--padding-m) var(--padding-l);

  background-color: var(--md-sys-color-surface-container-highest);
  border-radius: var(--border-radius-m);

  position: relative;
  width: 100%;

  .content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .title {
    ${theme.titleMedium}
  }

  .subTitle {
    ${theme.bodyMedium}
  }

  .icon {
    font-size: 30px;
  }
`

export const Footer = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: var(--base-gap-large);
  width: 100%;
  margin-top: 16px;

  button:not(.filled) {
    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }
`

export const Error = styled.div`
  display: flex;
  align-items: center;
  padding: var(--padding-m);
  gap: var(--base-gap-large);
  border-radius: var(--border-radius-m);

  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
`

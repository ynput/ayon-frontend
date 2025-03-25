import { theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const TrialEndContainer = styled.div`
  position: fixed;
  inset: 0;

  display: flex;
  justify-content: center;
  align-items: center;
  background-image: linear-gradient(to right top, #1f292f, #232e35, #28323b, #2c3741, #313c47);
  nav {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;

    padding: var(--padding-m);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logout {
    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }
`

export const TrialEndCard = styled.div`
  padding: 32px;
  border-radius: var(--border-radius-xxl);
  background-color: var(--md-sys-color-secondary-container);
  box-shadow: 0 0 1rem rgba(0, 0, 0, 0.1);
  max-width: 500px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 32px;

  p,
  u {
    ${theme.bodyLarge}
    text-align: center;
    margin: 0;
  }

  u {
    cursor: pointer;
    color: var(--md-sys-color-primary);
  }

  h1 {
    text-align: center;
    ${theme.headlineLarge}
    margin: 0;
  }

  button {
    width: 100%;
    ${theme.titleMedium}
    padding: 8px;
  }
`

export const Logo = styled.img`
  height: 40px;
`

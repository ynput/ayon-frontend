import Markdown from 'react-markdown'
import styled from 'styled-components'
import { markdownStyle } from './markdown'

export const LoginForm = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 32px;
  position: relative;
  background-color: rgba(28, 32, 38, 0.95);
  padding: 32px;
  border-radius: var(--border-radius-xxl);
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);
  max-height: min(70vh, 800px);

  /* panel */
  & > div {
    background-color: unset;
    align-items: center;
    padding: 32px;
    width: 350px;
    overflow: hidden;
    max-height: 100%;

    p {
      margin: 0;
      text-align: center;

      a {
        text-decoration: underline;
      }
    }
  }

  /* company */
  & > div:first-child {
    p {
      text-align: left;
    }
  }

  /* login */
  & > div:last-child {
    background-color: var(--md-sys-color-surface-container);
  }

  button {
    padding: 8px 12px;
    height: 40px;
    max-height: unset;

    svg {
      width: 24px;
    }

    .icon {
      font-size: 24px !important;
    }
  }

  /* name password form */
  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: var(--base-gap-large);

    & > * {
      width: 100%;
    }
  }
`

export const Methods = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 100%;

  a,
  button {
    width: 100%;
  }
`

// AYON Logo
export const Ayon = styled.img`
  height: 60px;
`
export const Logo = styled.img`
  max-height: 100%;
  width: 100%;
  object-fit: contain;
  overflow: hidden;
`

export const BG = styled.img`
  position: fixed;
  z-index: -10;
  object-fit: cover;
  width: 100vw;
  height: 100vh;
`

export const MessageMarkdown = styled(Markdown)`
  max-width: 100%;
  height: 100%;
  overflow: auto;

  ${markdownStyle}
`

import { Panel, SaveButton, Section as SectionComp } from '@ynput/ayon-react-components'
import styled, { css, keyframes } from 'styled-components'

export const Logo = styled.img`
  width: 100px;
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
`

export const BG = styled.img`
  position: fixed;
  z-index: -10;
  object-fit: cover;
  width: 100vw;
  height: 100vh;
`

export const StepPanel = styled(Panel)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 32px;
  position: relative;
  background-color: var(--panel-background);
  padding: 64px;
  border-radius: 6px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);
  max-height: 550px;
  min-height: 550px;

  h2 {
    text-align: center;
  }

  p {
    margin: 0;
  }
`

export const Login = styled.section`
  display: flex;
  width: 470px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  height: 100%;

  .more {
    margin-top: auto;
    /* underline */
    text-decoration: underline;
    cursor: pointer;
  }
`

export const More = styled.section`
  display: flex;
  flex-direction: column;
  /* gap: 16px; */
  width: 350px;
  height: 100%;

  /* border right */
  border-right: 2px solid var(--md-sys-color-outline-variant);
  padding-right: 32px;

  .skip {
    margin-top: 16px;
    /* underline */
    text-decoration: underline;
    cursor: pointer;
  }
`

export const Skip = styled.span`
  margin-top: auto;
  /* underline */
  text-decoration: underline;
  cursor: pointer;
`

export const Section = styled(SectionComp)`
  overflow: hidden;
  height: 100%;
  padding: 1px;
`

export const PresetsContainer = styled.ul`
  display: flex;
  width: 470px;
  max-width: 470px;
  flex-direction: column;
  align-items: center;
  gap: var(--base-gap-large);
  padding: 0;
  margin: 0;
  flex: 1;
  overflow: auto;
`

export const AddonsContainer = styled.div`
  /* 3 column grid */
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--base-gap-small);
  width: 470px;
  max-width: 470px;
  max-height: 422px;

  overflow: auto;
`

export const Footer = styled.footer`
  display: flex;
  gap: var(--base-gap-large);
  width: 100%;
  justify-content: flex-end;
  margin-top: auto;

  button {
    padding: 8px 16px;
    min-height: unset;
    min-width: unset;
    max-width: unset;
    max-height: unset;
  }

  .back {
    background-color: unset !important;
  }

  .next {
    width: 110px;
  }

  ${({ $showIcon }) =>
    !$showIcon &&
    css`
      .icon {
        display: none;
      }
    `}
`

export const Connect = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--base-gap-small);

  button {
    width: unset;
  }
`
const spin = keyframes`
to {
  transform: rotate(360deg);
}
`

export const NextButton = styled(SaveButton)`
  background-color: var(--md-sys-color-tertiary);
  color: var(--md-sys-color-on-tertiary);

  &:hover {
    background-color: var(--md-sys-color-tertiary-hover);
  }

  :disabled {
    &,
    &:hover {
      background-color: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      opacity: 0.6;
    }
  }

  ${({ saving }) =>
    saving &&
    css`
      /* spin icon */
      .icon {
        animation: ${spin} 1s linear infinite;
      }
    `}
`

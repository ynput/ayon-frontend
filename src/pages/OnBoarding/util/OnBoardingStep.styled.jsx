import { Panel, SaveButton, Section as SectionComp } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

// import some styles from LoginPage and export them as Styled
export * from '/src/pages/LoginPage/LoginPage.styled'

export const StepPanel = styled(Panel)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 32px;
  position: relative;
  background-color: var(--color-grey-00);
  padding: 64px;
  border-radius: 6px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);
  max-height: 550px;
  min-height: 550px;

  h2 {
    font-size: 24px;
    text-align: center;
  }

  p {
    margin: 0;
  }
`

export const Login = styled.section`
  display: flex;
  width: 300px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  height: 100%;

  button {
    margin-top: 8px;
  }

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
  border-right: 2px solid var(--color-grey-01);
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
  gap: 8px;
  padding: 0;
  margin: 0;
  flex: 1;
`

export const AddonsContainer = styled.div`
  /* 3 column grid */
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  width: 470px;
  max-width: 470px;
  max-height: 422px;

  overflow: auto;
`

export const Footer = styled.footer`
  display: flex;
  gap: 8px;
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
  gap: 4px;

  button {
    width: unset;
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
      color: var(--md-sys-color-on-surface-variant);
    }
  }
`

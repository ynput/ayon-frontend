import { Button, Dialog, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const PowerpackDialog = styled(Dialog)`
  background: linear-gradient(180deg, rgb(0 121 181 / 0%) -12.03%, rgb(4 255 227 / 26%) 105.38%),
    #15171c;

  width: 550px;
  max-height: unset;
  height: unset;
  border-radius: 16px;

  .body {
    gap: 32px;
    padding: 16px 32px;
    align-items: center;
  }

  .icon {
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  }

  .cancelButton {
    background-color: unset;
  }
`

export const MainFeature = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: var(--border-radius-l);
  border: 1px solid var(--md-sys-color-tertiary);
  color: var(--md-sys-color-tertiary);
  width: 100%;

  h1 {
    margin: 0;
    ${theme.headlineSmall}

    display: flex;
    align-items: center;
    gap: var(--base-gap-small);
  }

  h2 {
    margin: 0;
    ${theme.bodyLarge}
    text-align: center;
  }

  .icon {
    font-size: 32px;
    color: var(--md-sys-color-tertiary);
  }
`

export const FeaturesList = styled.div`
  width: 100%;

  h3 {
    ${theme.bodyMedium}
    .green, .icon {
      color: var(--md-sys-color-tertiary);
    }
    .green {
      margin-right: 4px;
      padding-left: 4px;
    }
  }

  ul {
    margin: 0;
    margin-top: 8px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;

    li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
`

export const ShowAll = styled.div`
  cursor: pointer;
  text-align: center;
  margin-top: 16px;
  color: var(--md-sys-color-tertiary);
  ${theme.bodyMedium}

  &:hover {
    text-decoration: underline;
  }
`

export const MoreButton = styled(Button)`
  background-color: var(--md-sys-color-tertiary);
  color: var(--md-sys-color-on-tertiary);
  padding: 12px 20px;
  border-radius: var(--border-radius-l);
  margin-bottom: 16px;

  ${theme.titleMedium}

  &:hover {
    background-color: var(--md-sys-color-tertiary-hover);
  }
`

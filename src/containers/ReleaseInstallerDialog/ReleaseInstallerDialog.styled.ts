import { Dialog, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const FriendlyDialog = styled(Dialog)`
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-xxl);

  p {
    margin: 0;
    margin-bottom: 24px;
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

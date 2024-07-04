import { Toolbar } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--base-gap-large);
`

export const Header = styled(Toolbar)``
export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  gap: var(--base-gap-large);
`

export const ReviewPlayerWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

export const ReviewDetailsPanelWrapper = styled.div`
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  max-width: clamp(460px, 28vw, 600px);
  min-width: clamp(460px, 28vw, 600px);
  position: relative;
`

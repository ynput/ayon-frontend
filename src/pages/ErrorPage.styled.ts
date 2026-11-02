import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Page = styled.main`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  color: var(--md-sys-color-on-background);
  background: var(--md-sys-color-background);
`

export const Logo = styled.img`
  width: 140px;
  height: auto;
  margin-bottom: 8px;
`

export const Code = styled.div`
  color: var(--md-sys-color-primary);
  font-size: 112px;
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: 0;
`

export const Title = styled.h1`
  max-width: 100%;
  margin: 0;
  color: var(--md-sys-color-on-background);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0;
`

export const Description = styled.p`
  max-width: 420px;
  margin: -8px 0 0;
  color: var(--md-sys-color-outline);
  font-size: 15px;
  line-height: 1.5;
  text-align: center;
`

export const DashboardButton = styled(Button)`
  margin-top: 8px;

  &:focus-visible {
    outline: 2px solid var(--md-sys-color-tertiary);
    outline-offset: 3px;
  }
`

export const Links = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
`

import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import { PowerpackDialog, PowerpackDialogProps } from '@shared/components'

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
  overflow: hidden;
`

const BGImage = styled.img`
  position: absolute;
  inset: 0;
  top: -4px;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;

  /* blur */
  filter: blur(2px);
  opacity: 0.5;
`

interface SplashWrapperPageProps extends PowerpackDialogProps {
  splashImage?: string
  children?: ReactNode
}

export const SplashWrapperPage: FC<SplashWrapperPageProps> = ({
  splashImage = '/splash/review-splash.png',
  children,
  ...dialogProps
}) => {
  return (
    <Container>
      <BGImage src={splashImage} alt="Addon Splash" />
      <PowerpackDialog isCloseable={false} {...dialogProps} />
      {children}
    </Container>
  )
}

export default SplashWrapperPage

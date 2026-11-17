import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import { PowerpackDialog, PowerpackDialogProps } from '@shared/components'
import AddonUnavailableDialog from './AddonUnavailableDialog'
import { useAddonSplashState } from './SplashWrapperPageHelpers'

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
  // the sales dialog only when the addon isn't installed: a studio with the addon installed
  // but missing from its bundle has nothing to buy
  const addonState = useAddonSplashState(dialogProps.addon?.name)

  const renderDialog = () => {
    if (addonState.status === 'loading') return null
    if (dialogProps.addon && addonState.status !== 'notInstalled') {
      return (
        <AddonUnavailableDialog
          label={dialogProps.label}
          addon={dialogProps.addon}
          state={addonState}
        />
      )
    }
    return <PowerpackDialog isCloseable={false} {...dialogProps} />
  }

  return (
    <Container>
      <BGImage src={splashImage} alt="Addon Splash" />
      {renderDialog()}
      {children}
    </Container>
  )
}

export default SplashWrapperPage

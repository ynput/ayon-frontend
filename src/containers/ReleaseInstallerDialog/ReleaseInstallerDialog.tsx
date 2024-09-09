import { FC } from 'react'

// State
import { useAppDispatch, useAppSelector } from '@state/store'
import { toggleReleaseInstaller } from '@state/releaseInstaller'

// Components
import * as Styled from './ReleaseInstaller.styled'

// Helpers
import ReleaseInstaller from './ReleaseInstaller'

const ReleaseInstallerDialog: FC = () => {
  const dispatch = useAppDispatch()
  // STATE
  const closeDialog = () => dispatch(toggleReleaseInstaller(false))
  const isOpen = useAppSelector((state) => state.releaseInstaller.open)
  // STATE

  if (!isOpen) return null

  return (
    <Styled.FriendlyDialog
      isOpen
      onClose={closeDialog}
      header={<Styled.Header>Install latest release</Styled.Header>}
      size="md"
    >
      <ReleaseInstaller onFinish={closeDialog} />
    </Styled.FriendlyDialog>
  )
}

export default ReleaseInstallerDialog

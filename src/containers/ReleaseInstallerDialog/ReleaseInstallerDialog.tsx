import { FC } from 'react'

// State
import { useAppDispatch, useAppSelector } from '@state/store'
import { toggleReleaseInstaller } from '@state/releaseInstaller'

// Components
import * as Styled from './ReleaseInstaller.styled'

// Helpers
import ReleaseInstaller from './ReleaseInstaller'
import { useGetYnputConnectionsQuery } from '@queries/ynputConnect'
import ConnectDialog from '@pages/MarketPage/ConnectDialog/ConnectDialog'
import { useLocation } from 'react-router'

const ReleaseInstallerDialog: FC = () => {
  const location = useLocation()
  const dispatch = useAppDispatch()
  // STATE
  const closeDialog = () => dispatch(toggleReleaseInstaller({ open: false }))
  const isOpen = useAppSelector((state) => state.releaseInstaller.open)
  // STATE

  // check ynput cloud is connected before showing dialog
  const { data: connectData, isError } = useGetYnputConnectionsQuery({})

  if (!isOpen) return null

  if (isError || !connectData?.connected) {
    return <ConnectDialog redirect={location.pathname} visible onHide={closeDialog} />
  }

  return (
    <Styled.FriendlyDialog
      isOpen
      onClose={() => {}}
      hideCancelButton
      header={<Styled.Header>Install pipeline release</Styled.Header>}
      size="md"
    >
      <ReleaseInstaller onFinish={closeDialog} />
    </Styled.FriendlyDialog>
  )
}

export default ReleaseInstallerDialog

import { toggleReleaseInstaller } from '@state/releaseInstaller'
import { useAppDispatch, useAppSelector } from '@state/store'
import { Dialog } from '@ynput/ayon-react-components'
import { FC } from 'react'

const ReleaseInstallerDialog: FC = () => {
  const dispatch = useAppDispatch()

  const closeDialog = () => dispatch(toggleReleaseInstaller(false))

  const isOpen = useAppSelector((state) => state.releaseInstaller.open)

  return (
    <Dialog isOpen={isOpen} onClose={closeDialog}>
      Install latest release
    </Dialog>
  )
}

export default ReleaseInstallerDialog

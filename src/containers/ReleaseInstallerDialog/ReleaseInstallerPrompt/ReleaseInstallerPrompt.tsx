import useLocalStorage from '@hooks/useLocalStorage'
import * as Styled from './ReleaseInstallerPrompt.styled'
import { useNavigate } from 'react-router'
import { useAppDispatch } from '@state/store'
import { toggleReleaseInstaller } from '@state/releaseInstaller'
import { useListInstallersQuery } from '@queries/installers/getInstallers'
import { useListDependencyPackagesQuery } from '@queries/dependencyPackages/getDependencyPackages'

type Props = {
  isAdmin: boolean
}

const ReleaseInstallerPrompt = ({ isAdmin }: Props) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [showPrompt, setShowPrompt] = useLocalStorage<boolean>('releaseInstallPrompt', true)
  const notAdminOrDismissed = !showPrompt || !isAdmin

  // get installers and dep packages and show if there are no installers or no dep packages
  const { data: { installers } = {}, isSuccess: isInstallersSuccess } = useListInstallersQuery(
    {},
    { skip: notAdminOrDismissed },
  )
  const { data: { packages } = {}, isSuccess: isPackagesSuccess } = useListDependencyPackagesQuery(
    undefined,
    {
      skip: notAdminOrDismissed,
    },
  )

  const hasInstallersAndPackages =
    installers && !!installers?.length && packages && !!packages?.length

  if (
    !showPrompt ||
    !isAdmin ||
    hasInstallersAndPackages ||
    !isInstallersSuccess ||
    !isPackagesSuccess
  )
    return null

  const handleOpen = () => {
    // go to bundles page
    navigate('/settings/bundles')
    // open menu
    dispatch(toggleReleaseInstaller({ open: true }))
  }

  return (
    <Styled.Container>
      <Styled.DownloadButton icon={'valve'} onClick={handleOpen}>
        Setup pipeline
      </Styled.DownloadButton>

      <Styled.CloseButton icon="close" onClick={() => setShowPrompt(false)} />
    </Styled.Container>
  )
}

export default ReleaseInstallerPrompt

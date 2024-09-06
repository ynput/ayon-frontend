import { FC } from 'react'

// State
import { useAppDispatch, useAppSelector } from '@state/store'
import { toggleReleaseInstaller } from '@state/releaseInstaller'

// Queries
import { useGetReleasesQuery } from '@queries/releases/getReleases'

// Components
import * as Styled from './ReleaseInstallerDialog.styled'
import { Card } from './components/Card'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { formatDistance } from 'date-fns'

const ReleaseInstallerDialog: FC = () => {
  const dispatch = useAppDispatch()

  const closeDialog = () => dispatch(toggleReleaseInstaller(false))
  const isOpen = useAppSelector((state) => state.releaseInstaller.open)

  //   get latest releases
  const {
    data: { releases = [] } = {},
    isLoading: isLoadingReleases,
    error,
  } = useGetReleasesQuery()

  const firstRelease = releases[0]

  if (!firstRelease || error)
    return (
      <Styled.FriendlyDialog
        isOpen={isOpen}
        onClose={closeDialog}
        size="md"
        header={<Styled.Header>Install latest release</Styled.Header>}
      >
        <EmptyPlaceholder
          icon="error"
          message="No releases"
          error={'No releases found: ' + JSON.stringify(error)}
          style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}
        />
      </Styled.FriendlyDialog>
    )

  const releaseVersion = firstRelease.name.split('-')[0]
  const releaseSubTitle = `Ynput - ${releaseVersion} - ${formatDistance(
    new Date(firstRelease.createdAt),
    new Date(),
    { addSuffix: true },
  )}`

  return (
    <Styled.FriendlyDialog
      isOpen={isOpen}
      onClose={closeDialog}
      header={<Styled.Header>Install latest release</Styled.Header>}
      size="md"
    >
      <p className="bio">
        Releases are official packages with the latest tested and stable add-ons, dependencies, and
        installers.
      </p>
      <p className="bio">Your install is pre-configured here, but you can adjust it if needed.</p>

      <Card
        title="Release"
        subTitle={releaseSubTitle}
        icon="orders"
        isLoading={isLoadingReleases}
      />
    </Styled.FriendlyDialog>
  )
}

export default ReleaseInstallerDialog

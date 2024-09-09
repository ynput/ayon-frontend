import { FC } from 'react'
import { Card, Footer } from '../components'
import { createAddonsSubtitle, createInstallersSubtitle, createReleaseSubtitle } from '../helpers'
import { ReleaseFormType } from '@state/releaseInstaller'
import { ReleaseListItemModel } from '@api/rest/releases'
import { ReleaseForm } from '../hooks/useReleaseForm'

interface ReleaseInstallerOverviewProps {
  releaseForm: ReleaseForm
  release: ReleaseListItemModel | null
  isLoading: boolean
  onSwitchDialog: (dialog: ReleaseFormType) => void
  isFormValid: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const ReleaseInstallerOverview: FC<ReleaseInstallerOverviewProps> = ({
  release,
  isLoading,
  releaseForm,
  onSwitchDialog,
  isFormValid,
  onCancel,
  onConfirm,
}) => {
  return (
    <>
      <p className="bio">
        Releases are official packages with the latest tested and stable add-ons, dependencies, and
        installers.
      </p>
      <p className="bio">Your install is pre-configured here, but you can adjust it if needed.</p>

      <Card
        title="Release"
        subTitle={createReleaseSubtitle(release)}
        icon="orders"
        isLoading={isLoading}
      />
      <Card
        title="Addons"
        subTitle={createAddonsSubtitle(release?.addons || [], releaseForm.addons)}
        icon="extension"
        isLoading={isLoading}
        onChange={() => onSwitchDialog('addons')}
        required={releaseForm.addons.length === 0}
      />
      <Card
        title="AYON launchers"
        subTitle={createInstallersSubtitle(releaseForm.platforms)}
        icon="devices"
        isLoading={isLoading}
        onChange={() => onSwitchDialog('installers')}
        required={releaseForm.platforms.length === 0}
      />
      <span className="note">
        This will not affect your existing setup, a new bundle will be created for testing first.
      </span>
      <Footer
        onCancel={onCancel}
        onConfirm={onConfirm}
        isFinal
        saveButton={{ active: isFormValid }}
      />
    </>
  )
}

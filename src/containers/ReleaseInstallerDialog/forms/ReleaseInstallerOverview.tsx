import { FC } from 'react'
import { Card, Footer } from '../components'
import {
  areAddonsOnlyMandatory,
  createAddonsSubtitle,
  createInstallersSubtitle,
  createReleaseSubtitle,
} from '../helpers'
import { ReleaseFormType } from '@state/releaseInstaller'
import { ReleaseListItemModel } from '@shared/api'
import { ReleaseForm } from '../hooks/useReleaseForm'
import { Error } from '../ReleaseInstaller.styled'
import { Icon } from '@ynput/ayon-react-components'

interface ReleaseInstallerOverviewProps {
  releaseForm: ReleaseForm
  release: ReleaseListItemModel | null
  isLoading: boolean
  isLoadingRelease: boolean
  isSubmitting: boolean
  onSwitchDialog: (dialog: ReleaseFormType) => void
  isFormValid: boolean
  onCancel: () => void
  onConfirm: () => void
  error?: string | null
}

export const ReleaseInstallerOverview: FC<ReleaseInstallerOverviewProps> = ({
  release,
  isLoading,
  isLoadingRelease,
  isSubmitting,
  releaseForm,
  onSwitchDialog,
  isFormValid,
  onCancel,
  onConfirm,
  error,
}) => {
  return (
    <>
      <p className="description">
        Releases are official bundles with the latest tested and stable addons, launchers and their
        dependencies for your pipeline.
      </p>
      <p className="description">
        Your install is pre-configured here, but you can adjust it if needed.
      </p>

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
        required={
          releaseForm.addons.length === 0 ||
          areAddonsOnlyMandatory(releaseForm.addons, release?.mandatoryAddons, release?.addons)
        }
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
      {error && (
        <Error>
          <Icon icon="error" />
          Error installing release: {error}
        </Error>
      )}
      <Footer
        onCancel={onCancel}
        onConfirm={onConfirm}
        isFinal
        saveButton={{
          active: true,
          saving: isSubmitting || isLoading || isLoadingRelease,
          disabled: isLoading || isLoadingRelease || !isFormValid,
        }}
      />
    </>
  )
}

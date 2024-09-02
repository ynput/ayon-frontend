// React imports
import { useState, useEffect, useMemo } from 'react'

// Component imports
import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import { BundleBadges } from '@containers/BundleDropdown'
import { FriendlyDialog } from './CopyBundleSettingsDialog.styled'

// Query imports
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { useMigrateSettingsByBundleMutation } from '@queries/bundles/updateBundles'

// API imports
import { BundleModel } from '@api/rest'

// Other imports
import { toast } from 'react-toastify'
import * as Styled from './CopyBundleSettingsDialog.styled'
import CopyBundleSettingsDropdown from './CopyBundleSettingsDropdown'

type DialogBodyProps = {
  onCancel: () => void
  onFinish: () => void
  bundle?: BundleModel | null
  envTarget?: string | null // has the bundle just been set to production, staging, or dev
  devMode: boolean
}

const CopyBundleSettingsDialog = ({
  bundle,
  envTarget,
  onCancel,
  onFinish,
  devMode,
}: DialogBodyProps) => {
  const [sourceBundle, setSourceBundle] = useState<string | null>(null)
  const [sourceVariant, setSourceVariant] = useState('production')

  const { data: { bundles = [] } = {} } = useListBundlesQuery({})

  const currentProductionBundle = useMemo(
    () => bundles?.find((b) => b?.isProduction && !b?.isArchived),
    [bundles],
  )

  const currentStagingBundle = useMemo(
    () => bundles?.find((b) => b?.isStaging && !b?.isArchived),
    [bundles],
  )

  useEffect(() => {
    const determineVariantAndBundle = () => {
      if (envTarget === 'production' && currentProductionBundle) {
        return { variant: 'production', bundleName: currentProductionBundle.name }
      }
      if (envTarget === 'staging' && currentStagingBundle) {
        return { variant: 'staging', bundleName: currentStagingBundle.name }
      }

      // Handle case when envTarget is not set
      if (!envTarget && bundle) {
        if (bundle.isProduction && currentStagingBundle) {
          return { variant: 'staging', bundleName: currentStagingBundle.name }
        }
        if (!bundle.isProduction && currentProductionBundle) {
          return { variant: 'production', bundleName: currentProductionBundle.name }
        }
      }

      // Fallback to available bundle
      if (currentProductionBundle) {
        return { variant: 'production', bundleName: currentProductionBundle.name }
      }
      if (currentStagingBundle) {
        return { variant: 'staging', bundleName: currentStagingBundle.name }
      }

      // if there is nothing to copy from, hide the dialog
      return null
    }

    const bundleInfo = determineVariantAndBundle()
    if (bundleInfo) {
      setSourceVariant(bundleInfo.variant)
      setSourceBundle(bundleInfo.bundleName)
    } else {
      onCancel()
    }
  }, [currentProductionBundle, envTarget, currentStagingBundle, bundle])

  const handleClose = () => {
    onCancel()
  }

  const [migrateSettingsByBundle, { isLoading }] = useMigrateSettingsByBundleMutation()

  const handleConfirm = async () => {
    console.log('copying settings over')
    try {
      if (!sourceBundle || !sourceVariant) throw new Error('Bundle not found')
      if (!bundle || !envTarget) throw new Error('Bundle not found')
      await migrateSettingsByBundle({
        migrateBundleSettingsRequest: {
          sourceBundle: sourceBundle,
          targetBundle: bundle.name,
          sourceVariant: sourceVariant,
          targetVariant: envTarget,
        },
      }).unwrap()
    } catch (error: any) {
      console.error(error)
      toast.error('Failed to copy settings: ' + JSON.stringify(error))
    } finally {
      onFinish()
    }
  }

  let title = `Copy addon settings from another bundle's addons?`
  if (envTarget) {
    title = `Copy addon settings to your new ${envTarget} bundle?`
  }

  const header = (
    <>
      <span className="title">{title}</span>
      <span className="message">
        Addons do not share settings between different versions automatically. Would you like to
        copy the settings from an existing bundle to maintain the addon settings from the versions
        used there?
      </span>
    </>
  )

  const confirmActive = !!sourceBundle && !!sourceVariant
  const cancelLabel = envTarget ? 'Do not copy now' : 'Cancel'

  const footer = (
    <>
      <Button onClick={handleClose} label={cancelLabel} variant="text" className="cancel" />
      <SaveButton
        onClick={handleConfirm}
        label="Copy all settings"
        active={confirmActive}
        saving={isLoading}
      />
    </>
  )

  if (!bundle) return null

  let exclude = []
  const excludeBundleName = bundle.name
  // we cannot copy same bundle and same variant into itself
  if (bundle.isProduction) {
    exclude.push(excludeBundleName + '__production')
  }
  if (bundle.isStaging) {
    exclude.push(excludeBundleName + '__staging')
  }
  if (bundle.isDev) {
    exclude.push(excludeBundleName + '__dev')
  }

  return (
    <FriendlyDialog
      header={header}
      footer={footer}
      isOpen
      size="md"
      onClose={() => {}}
      hideCancelButton
    >
      <div className="cards">
        <Styled.BundleCard>
          <Styled.Row>
            <span>Bundle:</span>
            <CopyBundleSettingsDropdown
              bundles={bundles}
              bundle={sourceBundle}
              variant={sourceVariant}
              exclude={exclude}
              onBundleChange={(b, v) => {
                setSourceBundle(b)
                setSourceVariant(v)
              }}
            />
          </Styled.Row>
        </Styled.BundleCard>
        <Icon icon="arrow_right_alt" className="arrow" />
        <Styled.BundleCard>
          <Styled.Row>
            <span>Bundle:</span>
            <Styled.TargetBundle>{bundle.name}</Styled.TargetBundle>
            {envTarget ? (
              <BundleBadges
                startContent={<Icon icon="start" />}
                bundle={{
                  value: bundle.name,
                  label: bundle.name,
                  isProduction: envTarget === 'production',
                  isStaging: envTarget === 'staging',
                  isDev: envTarget === 'dev',
                }}
                devMode={devMode}
              />
            ) : (
              <BundleBadges
                bundle={{
                  value: bundle.name,
                  label: bundle.name,
                  isProduction: bundle.isProduction,
                  isStaging: bundle.isStaging,
                  isDev: bundle.isDev,
                }}
                devMode={devMode}
              />
            )}
          </Styled.Row>
        </Styled.BundleCard>
      </div>
      <span className="overrides">
        This will copy all studio settings, project setting overrides for all projects and site
        settings.
      </span>
    </FriendlyDialog>
  )
}

export default CopyBundleSettingsDialog

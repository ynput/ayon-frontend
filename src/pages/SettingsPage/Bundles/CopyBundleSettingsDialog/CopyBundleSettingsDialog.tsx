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
import { BundleModel } from '@shared/api'

// Other imports
import { toast } from 'react-toastify'
import * as Styled from './CopyBundleSettingsDialog.styled'
import CopyBundleSettingsDropdown, { SourceBundle } from './CopyBundleSettingsDropdown'

type DialogBodyProps = {
  onCancel: () => void
  onFinish: () => void
  bundle?: BundleModel | null
  previousBundle?: BundleModel | null
  envTarget?: string | null // has the bundle just been set to production, staging, or dev
  devMode: boolean
}

const CopyBundleSettingsDialog = ({
  bundle,
  previousBundle,
  envTarget,
  onCancel,
  onFinish,
  devMode,
}: DialogBodyProps) => {
  const [sourceBundle, setSourceBundle] = useState<string | null>(null)
  const [sourceVariant, setSourceVariant] = useState('production')

  const { data: { bundles = [] } = {} } = useListBundlesQuery({})

  //  replace bundle with previous bundle if it is set
  const sourceBundles = useMemo(() => {
    let updatedBundles: SourceBundle[] = [...bundles]
    if (previousBundle && envTarget !== 'dev') {
      const replaceIndex = updatedBundles.findIndex((b) => b.name === previousBundle.name)
      if (replaceIndex > -1) {
        updatedBundles[replaceIndex] = { ...previousBundle, previous: true }
      }
    }
    return updatedBundles
  }, [bundles, previousBundle, bundle])

  const currentProductionBundle = useMemo(
    () => sourceBundles?.find((b) => b?.isProduction && !b?.isArchived),
    [sourceBundles],
  )

  const currentStagingBundle = useMemo(
    () => sourceBundles?.find((b) => b?.isStaging && !b?.isArchived),
    [sourceBundles],
  )

  const firstDevBundle = useMemo(() => sourceBundles?.find((b) => b?.isDev), [sourceBundles])

  useEffect(() => {
    const determineVariantAndBundle = () => {
      if (
        previousBundle &&
        envTarget &&
        bundle?.name !== previousBundle.name &&
        envTarget !== 'dev'
      ) {
        return { variant: envTarget, bundleName: previousBundle.name }
      }

      // Fallback to available bundle
      if (envTarget || bundle?.isDev) {
        const isProdSelf =
          currentProductionBundle?.name === bundle?.name && envTarget === 'production'

        if (currentProductionBundle && !isProdSelf) {
          return { variant: 'production', bundleName: currentProductionBundle.name }
        }
        const isStagingSelf = currentStagingBundle?.name === bundle?.name && envTarget === 'staging'
        if (currentStagingBundle && !isStagingSelf) {
          return { variant: 'staging', bundleName: currentStagingBundle.name }
        }

        // last resort: if in dev mode, try and copy from the dev bundle
        if (devMode) {
          if (firstDevBundle) {
            return { variant: 'dev', bundleName: firstDevBundle.name }
          }
        }

        return null
      } else {
        // try and copy from the opposite variant
        if (bundle?.isProduction && currentStagingBundle) {
          return { variant: 'staging', bundleName: currentStagingBundle.name }
        } else if (bundle?.isStaging && currentProductionBundle) {
          return { variant: 'production', bundleName: currentProductionBundle.name }
        } else if (devMode && firstDevBundle) {
          return { variant: 'dev', bundleName: firstDevBundle.name }
        }
      }
    }

    const bundleInfo = determineVariantAndBundle()
    if (bundleInfo) {
      setSourceVariant(bundleInfo.variant)
      setSourceBundle(bundleInfo.bundleName)
    } else {
      onCancel()
    }
  }, [currentProductionBundle, envTarget, currentStagingBundle, bundle, sourceBundles, devMode])

  const handleClose = () => {
    onCancel()
  }

  const [migrateSettingsByBundle, { isLoading }] = useMigrateSettingsByBundleMutation()

  const handleConfirm = async () => {
    console.log('copying settings over')
    try {
      if (!sourceBundle || !sourceVariant || !bundle || !envTarget) {
        const missingFields = [
          !sourceBundle && 'Source bundle not found',
          !sourceVariant && 'Source variant not found',
          !bundle && 'Target bundle not found',
          !envTarget && 'Environment target not found',
        ].filter(Boolean)

        const errorMessage = missingFields.join(', ')
        throw { data: { detail: errorMessage } }
      }

      await migrateSettingsByBundle({
        migrateBundleSettingsRequest: {
          sourceBundle: sourceBundle,
          targetBundle: bundle.name,
          sourceVariant: ['production', 'staging'].includes(sourceVariant) ? sourceVariant : sourceBundle,
          targetVariant: ['production', 'staging'].includes(envTarget) ? envTarget : bundle.name,
        },
      }).unwrap()
      toast.success(`Settings copied from ${sourceBundle} successfully`)
    } catch (error: any) {
      console.error(error)
      toast.error('Failed to copy settings: ' + error?.data?.detail)
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
        Addons do not share settings between different versions automatically.
      </span>
      <span className="message">
        Here you can choose to apply all studio, project and site settings from the source to the
        target bundle automatically.
      </span>
    </>
  )

  const confirmActive = !!sourceBundle && !!sourceVariant
  const cancelLabel = envTarget ? 'Do not copy' : 'Cancel'

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
  if (envTarget) {
    if (bundle.isProduction && envTarget === 'production') {
      exclude.push(excludeBundleName + '__production')
    }
    if (bundle.isStaging && envTarget === 'staging') {
      exclude.push(excludeBundleName + '__staging')
    }
    if (bundle.isDev && envTarget === 'dev') {
      exclude.push(excludeBundleName + '__dev')
    }
  } else {
    if (bundle.isProduction) {
      exclude.push(excludeBundleName + '__production')
    }
    if (bundle.isStaging) {
      exclude.push(excludeBundleName + '__staging')
    }
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
        <Styled.BundleCard className="card">
          <Styled.Row>
            <span>Bundle:</span>
            <CopyBundleSettingsDropdown
              devMode={devMode}
              bundles={sourceBundles} // all bundles
              bundleValue={sourceBundle} // selected bundle name
              variantValue={sourceVariant} // selected bundle variant (production, staging, dev)
              exclude={exclude}
              onBundleChange={(b, v) => {
                setSourceBundle(b)
                setSourceVariant(v)
              }}
              onError={() => onCancel()}
            />
          </Styled.Row>
        </Styled.BundleCard>
        <Icon icon="arrow_right_alt" className="arrow" />
        <Styled.BundleCard className="card">
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
        If you skip this step, you can always copy addon settings selectively later on.
      </span>
    </FriendlyDialog>
  )
}

export default CopyBundleSettingsDialog

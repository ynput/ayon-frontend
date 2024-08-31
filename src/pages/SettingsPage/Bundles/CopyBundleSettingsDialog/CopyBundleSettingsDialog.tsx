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

type DialogBodyProps = {
  onCancel: () => void
  onFinish: () => void
  bundle?: BundleModel | null
  envTarget?: string | null // has the bundle just been set to production, staging, or dev
  source: string // default production bundle otherwise staging
  devMode: boolean
}

const CopyBundleSettingsDialog = ({
  bundle,
  envTarget,
  source,
  onCancel,
  onFinish,
  devMode,
}: DialogBodyProps) => {
  const [sourceBundle, setSourceBundle] = useState(source)

  // update the source bundle when the bundle changes
  useEffect(() => {
    setSourceBundle(source)
  }, [source])

  const [sourceVariant, setSourceVariant] = useState('production')

  const { data: { bundles = [] } = {} } = useListBundlesQuery({})

  const currentProductionBundle = useMemo(
    () => bundles?.find((b) => b?.isProduction && !b?.isArchived),
    [bundles],
  )

  useEffect(() => {
    if (!currentProductionBundle) return
    setSourceBundle(currentProductionBundle?.name)
  }, [currentProductionBundle])

  const handleClose = () => {
    onCancel()
  }

  const [migrateSettingsByBundle, { isLoading }] = useMigrateSettingsByBundleMutation()

  const handleConfirm = async () => {
    console.log('copying settings over')
    try {
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

  const header = (
    <>
      <span className="title">Would you like to copy addon settings?</span>
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
            <Styled.BundleSelect
              bundleName={sourceBundle}
              setBundleName={setSourceBundle}
              setVariant={setSourceVariant}
              exclude={[bundle.name]}
              activeOnly
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

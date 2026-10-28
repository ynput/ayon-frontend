import React, { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Button, Spacer, Toolbar } from '@ynput/ayon-react-components'
import * as Styled from './Bundles.styled'
import BundleForm from './BundleForm'
import BundleDeps from './BundleDeps'
import { DescriptionSection } from '@shared/components/DetailsPanelDetails'
import { getRequestErrorString } from '@shared/util'
import { cloneDeep, upperFirst } from 'lodash'
import BundleCompare from './BundleCompare'
import useAddonSelection from './useAddonSelection'
import { useUpdateBundleMutation, useListBundlesQuery } from '@shared/api'
import { getPlatformShortcutKey, KeyMode } from '@shared/util/platform'
import type { Addon } from './types'
import { useAddonSearchContext } from '@pages/SettingsPage/Bundles/context/addon-search'

type Installer = { version: string; platforms?: string[] }
type Bundle = {
  name: string
  isProduction?: boolean
  isStaging?: boolean
  isProject?: boolean
  installerVersion?: string
  addons: Record<string, string | null>
  addonDevelopment?: Record<string, { enabled?: boolean; path?: string }>
  activeUser?: string
  isDev?: boolean
  createdAt?: string
  updatedAt?: string
  description?: string | null
}

// Addon type now imported from ./types

type BundleDetailProps = {
  selectedBundles?: Bundle[]
  onDuplicate: (name: string) => void
  installers: Installer[]
  toggleBundleStatus: (state: 'staging' | 'production', name: string) => void
}

const BundleDetail: React.FC<BundleDetailProps> = ({
  selectedBundles = [],
  onDuplicate,
  installers,
  toggleBundleStatus,
}) => {
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null)

  const [formData, setFormData] = useState<Bundle | any>({} as Bundle)
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([])
  const [updateBundle] = useUpdateBundleMutation()
  const { filteredAddons, addons } = useAddonSearchContext()

  // list of all bundles because we need production versions of addons
  let { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: true })
  const currentProductionAddons = useMemo(
    () => bundles.find((b) => b.isProduction)?.addons || {},
    [bundles],
  )

  // data for first selected bundle
  const bundle = useMemo(() => {
    return selectedBundles.find((b) => b.name === selectedBundle) as Bundle
  }, [selectedBundles, selectedBundle])

  const bundleStates = [
    {
      name: 'staging',
      active: selectedBundles.length > 1 ? false : bundle?.isStaging,
    },
    {
      name: 'production',
      active: selectedBundles.length > 1 ? false : bundle?.isProduction,
    },
  ]

  // Select addon if query search has addon=addonName
  const addonListRef = useRef<any>()
  useAddonSelection<Addon>(filteredAddons, setSelectedAddons, addonListRef, [formData])

  // every time we select a new bundle, update the form data
  useEffect(() => {
    if (selectedBundles.length) {
      const selectedBundleData = selectedBundles.find((b) => b.name === selectedBundle)

      if (!selectedBundleData) {
        const mbundle = cloneDeep(selectedBundles[0])
        setSelectedBundle(selectedBundles[0].name)

        if (mbundle.isProject) {
          // if this is a project bundle, it only contains addons, that
          // allow project-level override of the bundle. the rest of the addons
          // is inherited from the studio bundle. so at this point, we fill
          // formData.addons with the inherited addons from the project production
          // in order to have working bundle checks.
          // Inherited addons are removed upon saving server-side, so we can
          // keep them in formData safely
          //
          // BundlesAddonList shows inherited addons differently
          // ATM this does not support inheriting from the staging bundle as we'd need
          // an additional switch somewhere to select the enviroment.
          for (const addon of addons) {
            const prodVersion = currentProductionAddons[addon.name]
            if (addon.projectCanOverrideAddonVersion) continue // skip addons that allow project-level override
            if (!prodVersion) continue // skip addons that are not in the production bundle
            mbundle.addons[addon.name] = currentProductionAddons[addon.name]
          }
        }

        setFormData(mbundle)
      }
    }
  }, [selectedBundles, selectedBundle, addons, currentProductionAddons])

  const handleDescriptionSave = async (value: string) => {
    const description = value.trim() ? value : null
    if (description === (bundle.description || null)) return
    // patch is not part of the api args, it feeds the optimistic update
    const args = {
      bundleName: bundle.name,
      bundlePatchModel: { description },
      patch: { ...bundle, description },
    }
    try {
      await updateBundle(args).unwrap()
      toast.success('Bundle description saved')
    } catch (error) {
      toast.error(getRequestErrorString(error) || 'Failed to save bundle description')
    }
  }

  const handleAddonAutoSave = async (addon: string, version: string | null) => {
    try {
      await updateBundle({
        bundleName: bundle.name,
        bundlePatchModel: { addons: { [addon]: version as string } },
      }).unwrap()
      toast.success(`Bundle addon updated ${addon}: ${version}`)
    } catch (error) {
      toast.error((error as any)?.data?.detail || 'Failed to update bundle addon')
    }
  }

  return (
    <>
      {/** Cast styled button to any to allow transient $hl prop */}
      {(() => null)()}
      <Toolbar>
        <Spacer />
        <>
          {bundleStates.map(({ name, active }) => {
            const BadgeButton: any = Styled.BadgeButton
            return (
              <BadgeButton
                key={name}
                $hl={active ? name : null}
                icon={active ? 'check' : undefined}
                onClick={() => toggleBundleStatus(name as 'staging' | 'production', bundle.name)}
                disabled={selectedBundles.length > 1}
                data-tooltip={`${!active ? 'Set' : 'Unset'} bundle to ${name}`}
              >
                {!active ? 'Set' : ''} {upperFirst(name)}
              </BadgeButton>
            )
          })}
        </>
        <Button
          label="Duplicate and edit"
          icon="edit_document"
          onClick={() => onDuplicate(bundle.name)}
          disabled={selectedBundles.length > 1}
          data-tooltip="Creates new duplicated bundle"
          data-shortcut={getPlatformShortcutKey('D', [KeyMode.Shift])}
        />
      </Toolbar>
      {selectedBundles.length > 1 && selectedBundles.length < 5 ? (
        <BundleCompare bundles={selectedBundles as any} addons={filteredAddons as any} />
      ) : (
        <BundleForm
          isNew={false}
          addonListRef={addonListRef}
          {...{ selectedAddons, setSelectedAddons, formData, setFormData, installers }}
          onAddonAutoUpdate={handleAddonAutoSave}
          createdAt={(bundle ?? selectedBundles[0])?.createdAt}
          updatedAt={(bundle ?? selectedBundles[0])?.updatedAt}
        >
          <BundleDeps bundle={bundle} onChange={undefined as any} />
          {bundle && (
            <DescriptionSection
              key={bundle.name}
              description={bundle.description || ''}
              isMixed={false}
              enableEditing
              isLoading={false}
              onChange={handleDescriptionSave}
            />
          )}
        </BundleForm>
      )}
    </>
  )
}

export default BundleDetail

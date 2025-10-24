import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import { Toolbar, Spacer, Button } from '@ynput/ayon-react-components'
import * as Styled from './Bundles.styled'
import BundleForm from './BundleForm'
import BundleDeps from './BundleDeps'
import { cloneDeep, upperFirst } from 'lodash'
import BundleCompare from './BundleCompare'
import useAddonSelection from './useAddonSelection'
import { useUpdateBundleMutation } from '@queries/bundles/updateBundles'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { getPlatformShortcutKey, KeyMode } from '@shared/util/platform'
import type { Addon } from './types'
import { useAddonSearch } from './useAddonSearch'

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
}

// Addon type now imported from ./types

type BundleDetailProps = {
  selectedBundles?: Bundle[]
  onDuplicate: (name: string) => void
  installers: Installer[]
  toggleBundleStatus: (state: 'staging' | 'production', name: string) => void
  addons: Array<Addon>
}

const BundleDetail: React.FC<BundleDetailProps> = ({
  selectedBundles = [],
  onDuplicate,
  installers,
  toggleBundleStatus,
  addons,
}) => {
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null)

  const [formData, setFormData] = useState<Bundle | any>({} as Bundle)
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([])
  const [updateBundle] = useUpdateBundleMutation()
  const { search, onSearchChange } = useAddonSearch(addons, setSelectedAddons)

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
  useAddonSelection<Addon>(addons, setSelectedAddons, addonListRef, [formData])

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

  const handleAddonAutoSave = async (addon: string, version: string | null) => {
    try {
      await updateBundle({ name: bundle.name, data: { addons: { [addon]: version } } }).unwrap()
      toast.success(`Bundle addon updated ${addon}: ${version}`)
    } catch (error) {
      console.error(error)
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
        <BundleCompare bundles={selectedBundles as any} addons={addons as any} />
      ) : (
        <BundleForm
          isNew={false}
          addonListRef={addonListRef}
          {...{ selectedAddons, setSelectedAddons, formData, setFormData, installers }}
          onAddonAutoUpdate={handleAddonAutoSave}
        >
          <Styled.AddonTools>
            <Styled.StyledInput
              value={search}
              onChange={onSearchChange}
              placeholder="Search addons..."
              aria-label="Search addons"
            />
          </Styled.AddonTools>
          <BundleDeps bundle={bundle} onChange={undefined as any} />
        </BundleForm>
      )}
    </>
  )
}

export default BundleDetail

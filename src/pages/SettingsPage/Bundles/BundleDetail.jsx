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
import { current } from '@reduxjs/toolkit'

const BundleDetail = ({
  selectedBundles = [],
  onDuplicate,
  installers,
  toggleBundleStatus,
  addons,
}) => {
  const [selectedBundle, setSelectedBundle] = useState(null)

  const [formData, setFormData] = useState({})
  const [selectedAddons, setSelectedAddons] = useState([])
  const [updateBundle] = useUpdateBundleMutation()

  // list of all bundles because we need production versions of addons
  let { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: true })
  const currentProductionAddons = useMemo(
    () => bundles.find((b) => b.isProduction)?.addons || {},
    [bundles],
  )

  // data for first selected bundle
  const bundle = useMemo(() => {
    return selectedBundles.find((b) => b.name === selectedBundle)
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
  const addonListRef = useRef()
  useAddonSelection(addons, setSelectedAddons, addonListRef, [formData])

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
            if (addon.allowProjectOverride) continue // skip addons that allow project-level override
            if (!prodVersion) continue // skip addons that are not in the production bundle
            mbundle.addons[addon.name] = currentProductionAddons[addon.name]
          }
        }

        setFormData(mbundle)
      }
    }
  }, [selectedBundles, selectedBundle, addons, currentProductionAddons])

  const handleAddonAutoSave = async (addon, version) => {
    try {
      await updateBundle({ name: bundle.name, data: { addons: { [addon]: version } } }).unwrap()
      toast.success(`Bundle addon updated ${addon}: ${version}`)
    } catch (error) {
      console.error(error)
      toast.error(error.data?.detail || 'Failed to update bundle addon')
    }
  }

  return (
    <>
      <Toolbar>
        <Spacer />
        <>
          {bundleStates.map(({ name, active }) => (
            <Styled.BadgeButton
              key={name}
              $hl={active ? name : null}
              icon={active && 'check'}
              onClick={() => toggleBundleStatus(name, bundle.name)}
              disabled={selectedBundles.length > 1}
              data-tooltip={`${!active ? 'Set' : 'Unset'} bundle to ${name}`}
            >
              {!active ? 'Set' : ''} {upperFirst(name)}
            </Styled.BadgeButton>
          ))}
        </>
        <Button
          label="Duplicate and edit"
          icon="edit_document"
          onClick={() => onDuplicate(bundle.name)}
          disabled={selectedBundles.length > 1}
          data-tooltip="Creates new duplicated bundle"
          data-shortcut="shift+D"
        />
      </Toolbar>
      {selectedBundles.length > 1 && selectedBundles.length < 5 ? (
        <BundleCompare bundles={selectedBundles} addons={addons} />
      ) : (
        <BundleForm
          isNew={false}
          addonListRef={addonListRef}
          {...{ selectedAddons, setSelectedAddons, formData, setFormData, installers }}
          onAddonAutoUpdate={handleAddonAutoSave}
        >
          <BundleDeps bundle={bundle} />
        </BundleForm>
      )}
    </>
  )
}

export default BundleDetail

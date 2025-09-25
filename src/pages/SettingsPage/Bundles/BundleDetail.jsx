import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import { Toolbar, Spacer, Button } from '@ynput/ayon-react-components'
import * as Styled from './Bundles.styled'
import BundleForm from './BundleForm'
import BundleDeps from './BundleDeps'
import { upperFirst } from 'lodash'
import BundleCompare from './BundleCompare'
import useAddonSelection from './useAddonSelection'
import { useUpdateBundleMutation } from '@queries/bundles/updateBundles'
import { getPlatformShortcutKey, KeyMode } from '@shared/util/platform'

const BundleDetail = ({ bundles = [], onDuplicate, installers, toggleBundleStatus, addons }) => {
  const [selectedBundle, setSelectedBundle] = useState(null)

  const [formData, setFormData] = useState({})
  const [selectedAddons, setSelectedAddons] = useState([])
  const [updateBundle] = useUpdateBundleMutation()

  // data for first selected bundle
  const bundle = useMemo(() => {
    return bundles.find((b) => b.name === selectedBundle)
  }, [bundles, selectedBundle])

  const bundleStates = [
    {
      name: 'staging',
      active: bundles.length > 1 ? false : bundle?.isStaging,
    },
    {
      name: 'production',
      active: bundles.length > 1 ? false : bundle?.isProduction,
    },
  ]

  // Select addon if query search has addon=addonName
  const addonListRef = useRef()
  useAddonSelection(addons, setSelectedAddons, addonListRef, [formData])

  // every time we select a new bundle, update the form data
  useEffect(() => {
    if (bundles.length) {
      const selectedBundleData = bundles.find((b) => b.name === selectedBundle)

      if (!selectedBundleData) {
        setSelectedBundle(bundles[0].name)
        setFormData(bundles[0])
      }
    }
  }, [bundles, selectedBundle])

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
              disabled={bundles.length > 1}
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
          disabled={bundles.length > 1}
          data-tooltip="Creates new duplicated bundle"
          data-shortcut={getPlatformShortcutKey('D', [KeyMode.Shift])}
        />
      </Toolbar>
      {bundles.length > 1 && bundles.length < 5 ? (
        <BundleCompare bundles={bundles} addons={addons} />
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

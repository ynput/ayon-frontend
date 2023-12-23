import { useState, useEffect, useMemo, useRef } from 'react'
// import { toast } from 'react-toastify'
import { Toolbar, Spacer, Button } from '@ynput/ayon-react-components'
import * as Styled from './Bundles.styled'
import BundleForm from './BundleForm'
import BundleDeps from './BundleDeps'
import { upperFirst } from 'lodash'
import BundleCompare from './BundleCompare'
import { useSearchParams } from 'react-router-dom'

const BundleDetail = ({ bundles = [], onDuplicate, installers, toggleBundleStatus, addons }) => {
  const [selectedBundle, setSelectedBundle] = useState(null)

  const [formData, setFormData] = useState({})
  const [selectedAddons, setSelectedAddons] = useState([])

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

  const addonListRef = useRef()
  const [searchParams, setSearchParams] = useSearchParams()
  // if there is a url query addon={name}
  useEffect(() => {
    if (addons.length === 0 || !addonListRef.current) return

    const addon = searchParams.get('addon')
    // no addon query
    if (!addon) return

    const foundAddon = addons.find((a) => a.name === addon)
    const foundIndex = addons.findIndex((a) => a.name === addon)

    if (foundAddon) {
      setSelectedAddons([foundAddon])

      const tableEl = addonListRef.current.getTable()
      if (tableEl) {
        const tbody = tableEl.querySelector('tbody')
        const selectedRow = tbody.children[foundIndex]

        if (selectedRow) {
          selectedRow.scrollIntoView({
            block: 'center',
          })
        }
      }
    }

    // delete
    searchParams.delete('addon')
    setSearchParams(searchParams)
  }, [searchParams, addons, addonListRef])

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
              data-shortcut={`shift+${name.charAt(0).toUpperCase()}`}
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
          data-shortcut="shift+D"
        />
      </Toolbar>
      {bundles.length > 1 && bundles.length < 5 ? (
        <BundleCompare bundles={bundles} addons={addons} />
      ) : (
        <BundleForm
          isNew={false}
          addonListRef={addonListRef}
          {...{ selectedAddons, setSelectedAddons, formData, setFormData, installers }}
        >
          <BundleDeps bundle={bundle} />
        </BundleForm>
      )}
    </>
  )
}

export default BundleDetail

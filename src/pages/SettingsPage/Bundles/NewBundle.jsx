import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { Toolbar, Spacer, SaveButton, Button } from '@ynput/ayon-react-components'
import { useCreateBundleMutation, useUpdateBundleMutation } from '@queries/bundles/updateBundles'

import BundleForm from './BundleForm'
import * as Styled from './Bundles.styled'
import getLatestSemver from './getLatestSemver'
import { isEqual, union } from 'lodash'
import BundleDeps from './BundleDeps'
import useAddonSelection from './useAddonSelection'
import { useSearchParams } from 'react-router-dom'
import Shortcuts from '@containers/Shortcuts'
import { useCheckBundleCompatibilityQuery } from '@queries/bundles/getBundles'
import BundleChecks from './BundleChecks/BundleChecks'
import usePrevious from '@hooks/usePrevious'
import { getPlatformShortcutKey, KeyMode } from '@shared/util'

const removeEmptyDevAddons = (addons = {}) => {
  if (!addons) return addons
  const newAddonDevelopment = {}
  for (const [key, value] of Object.entries(addons)) {
    if (value.enabled || value.path) {
      newAddonDevelopment[key] = value
    }
  }
  return newAddonDevelopment
}

const NewBundle = ({ initBundle, onSave, addons, installers, isDev, developerMode }) => {
  // when updating a dev bundle, we need to track changes
  const [formData, setFormData] = useState(null)
  const [skipBundleCheck, setSkipBundleCheck] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const previousFormData = usePrevious(formData)

  const [createBundle, { isLoading: isCreating }] = useCreateBundleMutation()
  const [updateBundle, { isLoading: isUpdating }] = useUpdateBundleMutation()

  useEffect(() => {
    if (!formData || !previousFormData) {
      return
    }
    if (
      isEqual(formData.addonDevelopment, previousFormData.addonDevelopment) &&
      formData.name === previousFormData.name
    ) {
      setSkipBundleCheck(false)
    } else {
      setSkipBundleCheck(true)
    }
  }, [formData])

  const {
    data: bundleCheckData = {},
    isFetching: isFetchingCheck,
    isError: isCheckError,
  } = useCheckBundleCompatibilityQuery(
    {
      bundleModel: formData,
    },
    { skip: !formData || skipBundleCheck },
  )

  const bundleCheckError = bundleCheckData.issues?.some((issue) => issue.severity === 'error')


  //   build initial form data
  useEffect(() => {
    if (formData?.name === initBundle?.name) return

    if (initBundle) {
      // addons = [{name: 'addon1', versions:{'1.0.0': {}}}]
      // reduce down addons to latest version
      const initAddons = {}
      const initAddonsDev = {}
      for (const addon of addons) {
        const versionList = Object.keys(addon.versions || {})
        if (versionList.length) {
          const latestVersion = getLatestSemver(versionList)
          initAddons[addon.name] = latestVersion
        }

        if (isDev) {
          // check if there's an addon development
          if (!initBundle.addonDevelopment?.[addon.name]) {
            // create new addon development when there isn't one
            initAddonsDev[addon.name] = { path: '', enabled: false }
          }
        }
      }

      const initForm = {
        addons: initAddons,
        isDev: developerMode || isDev,
        addonDevelopment: { ...initBundle.addonDevelopment, ...initAddonsDev },
        ...initBundle,
      }

      setFormData(initForm)
    }
  }, [initBundle])

  // Select addon if query search has addon=addonName
  const addonListRef = useRef()
  const { selectAndScrollToAddon } = useAddonSelection(addons, setSelectedAddons, addonListRef, [
    formData,
  ])

  // if there's a version param of {[addonName]: version}, select that addon
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (!formData || !searchParams) return

    const addonVersionString = searchParams.get('versions')

    if (addonVersionString) {
      const addonVersionObject = JSON.parse(decodeURIComponent(addonVersionString)) || {}

      for (const addon in addonVersionObject) {
        const version = addonVersionObject[addon]

        // get addon from addons
        const addonObject = addons.find((a) => a.name === addon)
        if (!addonObject) continue

        // check addon has version
        if (version in addonObject.versions && addon in formData.addons) {
          // update from formData
          const newFormData = { ...formData, addons: { ...formData.addons, [addon]: version } }

          setFormData(newFormData)
        }
      }
    }

    // delete search params
    searchParams.delete('versions')
    setSearchParams(searchParams)
  }, [searchParams, formData])

  const handleSave = async () => {
    const data = { ...formData }

    if (!data?.name) {
      toast.error('Name is required')
      return
    }

    if (data?.name.includes(' ')) {
      toast.error('Name cannot contain spaces')
      return
    }

    if (!developerMode) data.isDev = false

    try {
      await createBundle({ data: data, force: data.isDev }).unwrap()
      toast.success('Bundle created')
      onSave(data.name)
    } catch (error) {
      console.log(error)
      toast.error('Error: ' + error?.data?.detail)
    }
  }

  const [devChanges, setDevChanges] = useState(false)

  useEffect(() => {
    if (!initBundle) return
    const latestFormData = { ...formData }
    latestFormData['addonDevelopment'] = removeEmptyDevAddons(latestFormData['addonDevelopment'])
    // check for changes
    isEqual(initBundle, latestFormData) ? setDevChanges(false) : setDevChanges(true)
  }, [initBundle, formData])

  const handleUpdate = async () => {
    // find the changes between initBundle and formData
    const changes = {}
    // create a unique list of keys
    var allKeys = union(Object.keys(initBundle), Object.keys(formData))
    // for each key, check if the values are the same, if not, add to changes
    for (const key of allKeys) {
      if (!isEqual(initBundle[key], formData[key])) {
        changes[key] = formData[key]
      }
    }

    // if changes includes addonDevelopment, we remove keys that have enabled and path false
    if (changes.addonDevelopment) {
      changes.addonDevelopment = removeEmptyDevAddons(changes.addonDevelopment)
    }

    try {
      await updateBundle({ name: initBundle.name, data: { ...changes } }).unwrap()

      toast.success('Dev bundle updated')
      setDevChanges(false)
    } catch (error) {
      console.error(error)
      toast.error('Unable to update bundle')
    }
  }

  const setSelectedVersion = (latest = false) => {
    setFormData((prev) => {
      // set all selected addons to latest version if in formData
      const newFormData = { ...prev }
      const newAddons = { ...newFormData.addons }
      for (const addon of selectedAddons) {
        if (!latest) {
          newAddons[addon.name] = null
          continue
        }
        const versionList = Object.keys(addon.versions || {})
        if (versionList.length) {
          const latestVersion = getLatestSemver(versionList)
          newAddons[addon.name] = latestVersion
        }
      } // end for
      newFormData.addons = newAddons
      return newFormData
    })
  }

  const handleAddonDevChange = (names = [], { key, value }) => {
    const newFormData = { ...formData }
    const addonDevelopment = { ...(newFormData.addonDevelopment || {}) }
    for (const name of names) {
      addonDevelopment[name] = { ...(addonDevelopment[name] || {}), [key]: value }
    }
    newFormData.addonDevelopment = addonDevelopment
    setFormData(newFormData)
  }

  // when dep packages are changed in dev mode
  const handleDepPackagesDevChange = (packages) => {
    setFormData((prev) => {
      return { ...prev, dependencyPackages: packages }
    })
  }

  const handleIssueClick = (addonName) => {
    const addon = addons.find((a) => a.name === addonName)
    if (!addon) return

    // select and scroll into view
    selectAndScrollToAddon(addon)
  }

  // SHORTCUTS
  const shortcuts = [
    {
      key: 'A',
      action: () =>
        selectedAddons.length === addons.length ? setSelectedAddons([]) : setSelectedAddons(addons),
    },
  ]

  return (
    <>
      <Shortcuts shortcuts={shortcuts} deps={[addons, selectedAddons]} />
      <Toolbar>
        <Spacer />
        {isDev && (
          <>
            <Button
              disabled={!devChanges}
              title="Cancel changes"
              onClick={() => {
                setFormData(initBundle)
                setDevChanges(false)
              }}
            >
              Cancel
            </Button>
          </>
        )}
        <SaveButton
          label={isDev ? 'Save dev bundle' : 'Create new bundle'}
          onClick={isDev ? handleUpdate : handleSave}
          active={
            isDev
              ? !!formData?.name && devChanges
              : !!formData?.name && (!bundleCheckError || formData?.isDev)
          }
          saving={isCreating || isUpdating}
        />
      </Toolbar>
      <BundleForm
        isNew
        isDev={isDev}
        {...{
          selectedAddons,
          setSelectedAddons,
          setFormData,
          installers,
        }}
        formData={formData}
        onAddonDevChange={handleAddonDevChange}
        developerMode={developerMode}
        addonListRef={addonListRef}
      >
        <Styled.AddonTools>
          <Button
            label="Select all addons"
            icon="select_all"
            onClick={() => setSelectedAddons(addons)}
            data-shortcut={getPlatformShortcutKey('a', [ KeyMode.Shift])}
            id="select"
          />
          <Button
            label="Deselect all addons"
            icon="deselect"
            onClick={() => setSelectedAddons([])}
            data-shortcut={getPlatformShortcutKey('a', [ KeyMode.Shift])}
            id="deselect"
          />
          <Button
            label="Select activated"
            icon="check_circle"
            onClick={() => setSelectedAddons(addons.filter((a) => !!formData?.addons?.[a.name]))}
            data-tooltip="Select addons that have a version"
          />
          <Button
            label="Select deactivated"
            icon="block"
            onClick={() => setSelectedAddons(addons.filter((a) => !formData?.addons?.[a.name]))}
            data-tooltip="Select addons that have a NONE version"
          />
          <Button
            label="Version latest"
            icon="vertical_align_top"
            disabled={!selectedAddons.length}
            onClick={() => setSelectedVersion(true)}
            data-tooltip="Set selected addons to latest version"
          />
          <Button
            label="Version NONE"
            icon="vertical_align_bottom"
            disabled={!selectedAddons.length}
            onClick={() => setSelectedVersion(false)}
            data-tooltip="Set selected addons to NONE"
          />
          {(isDev || formData?.isDev) && (
            <>
              <Styled.BadgeButton
                label="Enable development"
                icon="code"
                $hl={'developer-surface'}
                disabled={!selectedAddons.length}
                onClick={() =>
                  handleAddonDevChange(
                    selectedAddons.map((a) => a.name),
                    { key: 'enabled', value: true },
                  )
                }
                style={{ width: '100%', gap: 8 }}
                data-tooltip="Enable development for selected addons"
              />
              <Styled.BadgeButton
                label="Disable development"
                icon="code_off"
                $hl={'developer-surface'}
                disabled={!selectedAddons.length}
                onClick={() =>
                  handleAddonDevChange(
                    selectedAddons.map((a) => a.name),
                    { key: 'enabled', value: false },
                  )
                }
                style={{ width: '100%', gap: 8 }}
                data-tooltip="Disable development for selected addons"
              />
            </>
          )}
        </Styled.AddonTools>
        {isDev && <BundleDeps bundle={formData} onChange={handleDepPackagesDevChange} />}

        <BundleChecks
          check={bundleCheckData}
          isLoading={isFetchingCheck}
          isCheckError={isCheckError}
          onIssueClick={handleIssueClick}
        />
      </BundleForm>
    </>
  )
}

export default NewBundle

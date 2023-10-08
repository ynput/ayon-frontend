import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Toolbar, Spacer, SaveButton, Button } from '@ynput/ayon-react-components'
import { useCreateBundleMutation, useUpdateBundleMutation } from '/src/services/bundles'

import BundleForm from './BundleForm'
import * as Styled from './Bundles.styled'
import getLatestSemver from './getLatestSemver'
import { isEqual, union } from 'lodash'
import BundleDeps from './BundleDeps'

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

const NewBundle = ({ initBundle, onSave, addons, installers, isLoading, isDev, developerMode }) => {
  // when updating a dev bundle, we need to track changes
  const [formData, setFormData] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])

  const [createBundle, { isLoading: isCreating }] = useCreateBundleMutation()
  const [updateBundle, { isLoading: isUpdating }] = useUpdateBundleMutation()

  //   build initial form data
  useEffect(() => {
    if (initBundle && !isLoading) {
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
        installerVersion: installers?.[0]?.version,
        name: '',
        ...initBundle,
        isDev: developerMode || isDev,
        addonDevelopment: { ...initBundle.addonDevelopment, ...initAddonsDev },
      }
      setFormData(initForm)
    }
  }, [initBundle, installers, isLoading, addons])

  const handleSave = async () => {
    if (!formData?.name) {
      toast.error('Name is required')
      return
    }

    if (formData?.name.includes(' ')) {
      toast.error('Name cannot contain spaces')
      return
    }

    if (!developerMode) formData.isDev = false

    try {
      await createBundle({ data: formData, archived: true }).unwrap()
      toast.success('Bundle created')
      onSave(formData.name)
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
          newAddons[addon.name] = undefined
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

  return (
    <>
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
          active={isDev ? !!formData?.name && devChanges : !!formData?.name}
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
      >
        <Styled.AddonTools>
          <Button
            label="Select all addons"
            icon="select_all"
            onClick={() => setSelectedAddons(addons)}
          />
          <Button
            label="Deselect all addons"
            icon="deselect"
            onClick={() => setSelectedAddons([])}
          />
          <Button
            label="Select activated"
            icon="check_circle"
            onClick={() => setSelectedAddons(addons.filter((a) => !!formData?.addons?.[a.name]))}
          />
          <Button
            label="Select deactivated"
            icon="block"
            onClick={() => setSelectedAddons(addons.filter((a) => !formData?.addons?.[a.name]))}
          />
          <Button
            label="Version latest"
            icon="vertical_align_top"
            disabled={!selectedAddons.length}
            onClick={() => setSelectedVersion(true)}
          />
          <Button
            label="Version NONE"
            icon="vertical_align_bottom"
            disabled={!selectedAddons.length}
            onClick={() => setSelectedVersion(false)}
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
              />
            </>
          )}
        </Styled.AddonTools>
        {isDev && <BundleDeps bundle={formData} />}
      </BundleForm>
    </>
  )
}

export default NewBundle

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Toolbar, Spacer, SaveButton, Button } from '@ynput/ayon-react-components'
import { useCreateBundleMutation, useUpdateBundleMutation } from '/src/services/bundles'

import BundleForm from './BundleForm'
import * as Styled from './Bundles.styled'
import getLatestSemver from './getLatestSemver'
import { isEqual, union } from 'lodash'
import BundleDeps from './BundleDeps'

const NewBundle = ({
  initBundle,
  onSave,
  addons,
  installers,
  isLoading,
  isDev,
  toggleBundleStatus,
}) => {
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
      for (const addon of addons) {
        const versionList = Object.keys(addon.versions || {})
        if (versionList.length) {
          const latestVersion = getLatestSemver(versionList)
          initAddons[addon.name] = latestVersion
        }
      }

      const initForm = {
        addons: initAddons,
        installerVersion: installers?.[0]?.version,
        name: '',
        ...initBundle,
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
    // check for changes
    isEqual(initBundle, formData) ? setDevChanges(false) : setDevChanges(true)
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
    try {
      await updateBundle({ name: initBundle.name, data: { ...changes } }).unwrap()

      toast.success('Dev bundle updated')
      setDevChanges(false)
    } catch (error) {
      console.error(error)
      toast.error('Unable to update bundle')
    }
  }

  const setSelectedVersion = (latest = false, dev) => {
    setFormData((prev) => {
      // set all selected addons to latest version if in formData
      const newFormData = { ...prev }
      const newAddons = { ...newFormData.addons }
      for (const addon of selectedAddons) {
        if (!latest) {
          newAddons[addon.name] = dev ? 'DEV' : undefined
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

  return (
    <>
      <Toolbar>
        <Spacer />
        {isDev && (
          <>
            <Styled.BadgeButton
              $hl={'developer'}
              icon={'cancel'}
              disabled={devChanges}
              onClick={() => toggleBundleStatus('isDev', initBundle.name)}
            >
              Unset Dev
            </Styled.BadgeButton>
            <Button disabled={!devChanges}>Cancel</Button>
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
          {isDev && (
            <Styled.BadgeButton
              label="Version to DEV"
              icon="code"
              $hl={'developer'}
              disabled={!selectedAddons.length}
              onClick={() => setSelectedVersion(false, true)}
              style={{
                gridColumn: 'span 2',
                justifyContent: 'center',
                width: 'auto',
              }}
            />
          )}
        </Styled.AddonTools>
        {isDev && <BundleDeps bundle={formData} />}
      </BundleForm>
    </>
  )
}

export default NewBundle

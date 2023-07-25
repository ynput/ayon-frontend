import { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Section, Toolbar, Spacer, SaveButton, Button } from '@ynput/ayon-react-components'
import { useGetInstallerListQuery } from '/src/services/installers'
import { useGetAddonListQuery } from '/src/services/addonList'
import { useCreateBundleMutation } from '/src/services/bundles'

import BundleForm from './BundleForm'
import styled from 'styled-components'
import getLatestSemver from './getLatestSemver'

const StyledTools = styled.div`
  margin-top: 18px;
  flex: 1;
  max-width: 400px;
  /* 2x2 grid */
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
`

const NewBundle = ({ initBundle, onSave }) => {
  const { data: installerList = [], isLoading: isLoadingInstallers } = useGetInstallerListQuery()
  const { data: addons, isLoading: isLoadingAddons } = useGetAddonListQuery({ showVersions: true })

  const [formData, setFormData] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])

  const [createBundle, { isLoading: isCreating }] = useCreateBundleMutation()

  //   build initial form data
  useEffect(() => {
    if (initBundle && !isLoadingInstallers && !isLoadingAddons) {
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
        installerVersion: installerList?.[0]?.version,
        name: '',
        ...initBundle,
      }
      setFormData(initForm)
    }
  }, [initBundle, installerList, isLoadingAddons, isLoadingAddons, addons])

  const installerVersions = useMemo(() => {
    if (!installerList) return []

    const r = {}
    for (const installer of installerList) {
      if (r[installer.version]) {
        r[installer.version].push(installer.platform)
      } else {
        r[installer.version] = [installer.platform]
      }
    }

    return Object.entries(r).map(([version, platforms]) => ({
      label: `${version} (${platforms.join(', ')})`,
      value: version,
    }))
  }, [installerList])

  const handleClear = () => {
    setFormData({ installerVersion: installerList?.[0]?.version, name: initBundle?.name })
  }

  const handleSave = async () => {
    if (!formData?.name) {
      toast.error('Name is required')
      return
    }

    try {
      await createBundle(formData).unwrap()
      toast.success('Bundle created')
      onSave(formData.name)
    } catch (error) {
      console.log(error)
      toast.error('Error: ' + error?.data?.detail)
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

  return (
    <Section style={{ overflow: 'hidden' }}>
      <Toolbar>
        <Spacer />
        <Button icon={'clear'} label="Clear" onClick={handleClear} />
        <SaveButton
          label="Create new bundle"
          icon={isCreating ? 'sync' : 'check'}
          onClick={handleSave}
          active={!!formData?.name}
          saving={isCreating}
        />
      </Toolbar>
      <BundleForm
        isNew
        {...{ selectedAddons, setSelectedAddons, setFormData, installerVersions }}
        formData={formData}
      >
        <StyledTools>
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
        </StyledTools>
      </BundleForm>
    </Section>
  )
}

export default NewBundle

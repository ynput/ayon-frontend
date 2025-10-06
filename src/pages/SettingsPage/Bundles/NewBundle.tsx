import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { Toolbar, Spacer, SaveButton, Button } from '@ynput/ayon-react-components'
import { useCreateBundleMutation, useUpdateBundleMutation } from '@queries/bundles/updateBundles'
import type { Addon } from './types'

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

type AddonDevelopment = Record<string, { enabled?: boolean; path?: string }>

const removeEmptyDevAddons = (addons: AddonDevelopment = {}): AddonDevelopment => {
  if (!addons) return addons
  const newAddonDevelopment: AddonDevelopment = {}
  for (const [key, value] of Object.entries(addons)) {
    if (value.enabled || value.path) {
      newAddonDevelopment[key] = value
    }
  }
  return newAddonDevelopment
}

type Installer = { version: string; platforms?: string[] }

interface LocalBundleFormData {
  addons?: Record<string, any>
  isDev?: boolean
  isProject?: boolean
  addonDevelopment?: Record<string, any>
  dependencyPackages?: Record<string, string | null>
  name?: string
  installers?: any[]
  [key: string]: any
}

type NewBundleProps = {
  initBundle: LocalBundleFormData | null
  onSave: (name: string) => void
  addons: Addon[]
  installers: Installer[]
  isDev: boolean
  developerMode?: boolean
}

const NewBundle: React.FC<NewBundleProps> = ({
  initBundle,
  onSave,
  addons,
  installers,
  isDev,
  developerMode,
}) => {
  // when updating a dev bundle, we need to track changes
  const [formData, setFormData] = useState<LocalBundleFormData | null>(null)
  const [skipBundleCheck, setSkipBundleCheck] = useState<boolean>(false)
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([])
  const previousFormData = usePrevious(formData)

  const [createBundle, { isLoading: isCreating }] = useCreateBundleMutation()
  const [updateBundle, { isLoading: isUpdating }] = useUpdateBundleMutation() as any

  useEffect(() => {
    if (!formData || !previousFormData) {
      return
    }
    if (
      isEqual(formData.addonDevelopment, (previousFormData as any)?.addonDevelopment) &&
      formData.name === (previousFormData as any)?.name
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
      bundleModel: formData as any,
    },
    { skip: !formData || skipBundleCheck },
  ) as any

  const bundleCheckError = bundleCheckData.issues?.some((issue: any) => issue.severity === 'error')

  //   build initial form data
  useEffect(() => {
    if (formData?.name === initBundle?.name) return

    if (initBundle) {
      const initAddons: Record<string, string> = {}
      const initAddonsDev: AddonDevelopment = {}

      if (initBundle.addons) {
        // Only use addons from initBundle.addons
        for (const addonName of Object.keys(initBundle.addons)) {
          initAddons[addonName] = initBundle.addons[addonName]
          if (isDev) {
            if (!initBundle.addonDevelopment?.[addonName]) {
              initAddonsDev[addonName] = { path: '', enabled: false }
            }
          }
        }
      } else {
        // Use latest versions for all available addons
        for (const addon of addons) {
          const versionList = Object.keys(addon.versions || {})
          if (versionList.length) {
            initAddons[addon.name] = getLatestSemver(versionList)
          }
          if (isDev) {
            if (!initBundle.addonDevelopment?.[addon.name]) {
              initAddonsDev[addon.name] = { path: '', enabled: false }
            }
          }
        }
      }

      const initForm: LocalBundleFormData = {
        ...initBundle,
        addons: initAddons,
        isDev: developerMode || isDev,
        isProject: false,
        addonDevelopment: { ...initBundle.addonDevelopment, ...initAddonsDev },
      }

      setFormData(initForm)
    }
  }, [initBundle]) //, currentProductionAddons])

  // Select addon if query search has addon=addonName
  const addonListRef = useRef<any>()
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
        if (version in addonObject.versions && formData.addons && addon in formData.addons) {
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
      toast.error('Error: ' + (error as any)?.data?.detail)
    }
  }

  const [devChanges, setDevChanges] = useState<boolean>(false)

  useEffect(() => {
    if (!initBundle) return
    const latestFormData = { ...formData }
    latestFormData['addonDevelopment'] = removeEmptyDevAddons(latestFormData['addonDevelopment'])
    // check for changes
    isEqual(initBundle, latestFormData) ? setDevChanges(false) : setDevChanges(true)
  }, [initBundle, formData])

  const handleUpdate = async () => {
    if (!initBundle || !formData) return

    // find the changes between initBundle and formData
    const changes: any = {}
    // create a unique list of keys
    var allKeys = union(Object.keys(initBundle || {}), Object.keys(formData || {}))
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
      if (!prev) return prev
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

  const handleAddonDevChange = (
    names: string[] = [],
    { key, value }: { key: 'enabled' | 'path'; value: any },
  ) => {
    if (!formData) return
    const newFormData = { ...formData }
    const addonDevelopment = { ...(newFormData.addonDevelopment || {}) }
    for (const name of names) {
      addonDevelopment[name] = { ...(addonDevelopment[name] || {}), [key]: value }
    }
    newFormData.addonDevelopment = addonDevelopment
    setFormData(newFormData)
  }

  // when dep packages are changed in dev mode
  const handleDepPackagesDevChange = (packages: Record<string, string | null>) => {
    setFormData((prev) => {
      return { ...prev, dependencyPackages: packages }
    })
  }

  const handleIssueClick = (addonName: string) => {
    const addon = addons.find((a) => a.name === addonName)
    if (!addon) return

    // select and scroll into view
    selectAndScrollToAddon(addon)
  }

  // SHORTCUTS
  const shortcuts: Array<{ key: string; action: () => void }> = [
    {
      key: 'A',
      action: () =>
        selectedAddons.length === addons.length ? setSelectedAddons([]) : setSelectedAddons(addons),
    },
  ]

  return (
    <>
      {Shortcuts && (
        <Shortcuts shortcuts={shortcuts as any} deps={[addons, selectedAddons] as any} />
      )}
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
        onProjectSwitchChange={() =>
          formData && setFormData({ ...formData, isProject: !formData?.isProject })
        }
      >
        <Styled.AddonTools>
          <Button
            label="Select all addons"
            icon="select_all"
            onClick={() => setSelectedAddons(addons)}
            data-shortcut={getPlatformShortcutKey('a', [KeyMode.Shift])}
            id="select"
          />
          <Button
            label="Deselect all addons"
            icon="deselect"
            onClick={() => setSelectedAddons([])}
            data-shortcut={getPlatformShortcutKey('a', [KeyMode.Shift])}
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

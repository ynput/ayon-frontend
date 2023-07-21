import { useMemo, useEffect } from 'react'
import { Button, Dropdown, FormLayout, FormRow } from '@ynput/ayon-react-components'
import { useGetAddonListQuery } from '/src/services/addonList'

const AddonListItem = ({ addonTitle, version, versions, setVersion, readOnly }) => {
  const options = useMemo(() => {
    return [
      { label: '(NONE)', value: null },
      ...(versions || []).map((version) => {
        return {
          label: version,
          value: version,
        }
      }),
    ]
  }, [versions])

  return (
    <FormRow label={addonTitle}>
      <Dropdown
        style={{ width: 200 }}
        options={options}
        value={version ? [version] : [null]}
        placeholder="(NONE)"
        onChange={(e) => setVersion(e[0])}
        disabled={readOnly}
      />
    </FormRow>
  )
}

const getLatestSemver = (versionList) => {
  // get the latest semver version from versionList
  // TODO: this is not correct. need to use semver to compare versions
  const latestVersion = versionList.reduce((acc, cur) => {
    return acc > cur ? acc : cur
  })
  return latestVersion
}

const AddonVersions = ({ formData, setFormData, readOnly }) => {
  const { data: addons, loading } = useGetAddonListQuery({ showVersions: true })

  if (loading) return <div>Loading...</div>

  useEffect(() => {
    if (!addons?.length) return
    if (formData?.addons === undefined) {
      // creating new bundle. fill in default (latest version) for each addon
      const newAddons = {}
      for (const addon of addons) {
        const versionList = Object.keys(addon.versions || {})

        if (versionList.length) {
          const latestVersion = getLatestSemver(versionList)
          newAddons[addon.name] = latestVersion
        }
      } // end for
      setFormData((prev) => {
        //console.log('creating new bundle', newAddons)
        const newFormData = { ...prev }
        newFormData.addons = newAddons
        return newFormData
      })
    }
  }, [addons, formData.addons])

  const onSetVersion = (addonName, version) => {
    setFormData((prev) => {
      const newFormData = { ...prev }
      const addons = { ...(newFormData.addons || {}) }
      addons[addonName] = version
      newFormData.addons = addons
      return newFormData
    })
  }

  const enableAll = () => {
    setFormData((prev) => {
      const newFormData = { ...prev }
      const newAddons = { ...(newFormData.addons || {}) }
      for (const addon in newAddons) {
        const vlist = addons.find((a) => a.name === addon)
        newAddons[addon] = getLatestSemver(Object.keys(vlist.versions))
      }
      newFormData.addons = newAddons
      return newFormData
    })
  }

  const disableAll = () => {
    setFormData((prev) => {
      const newFormData = { ...prev }
      const newAddons = { ...(newFormData.addons || {}) }
      for (const addon in newAddons) {
        newAddons[addon] = null
      }
      newFormData.addons = newAddons
      return newFormData
    })
  }

  return (
    <FormLayout>
      {addons?.length &&
        addons.map((addon) => (
          <AddonListItem
            key={addon.name}
            addonTitle={addon.title}
            version={formData?.addons?.[addon.name]}
            versions={Object.keys(addon.versions || {})}
            setVersion={(version) => onSetVersion(addon.name, version)}
            readOnly={readOnly}
          />
        ))}
      <FormRow style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexGrow: 1 }}>
          <Button disabled={readOnly} icon="toggle_on" label="Enable all" onClick={enableAll} />
          <Button disabled={readOnly} icon="toggle_off" label="Disable all" onClick={disableAll} />
        </div>
      </FormRow>
    </FormLayout>
  )
}

export default AddonVersions

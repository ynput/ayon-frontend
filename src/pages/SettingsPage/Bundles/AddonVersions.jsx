import { useMemo, useEffect } from 'react'
import { Dropdown, FormLayout, FormRow } from '@ynput/ayon-react-components'
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

        // get the latest semver version from versionList
        // TODO: this is not correct. need to use semver to compare versions
        if (versionList.length) {
          const latestVersion = versionList.reduce((acc, cur) => {
            return acc > cur ? acc : cur
          })
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
    </FormLayout>
  )
}

export default AddonVersions

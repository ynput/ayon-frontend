import { useMemo } from 'react'
import { toast } from 'react-toastify'
import { Dropdown } from '@ynput/ayon-react-components'
import { useGetAddonListQuery } from '@queries/addons/getAddons'

const AddonDropdown = ({ addonName, addonVersion, setAddonVersion, disabled }) => {
  const { data, isLoading, isError } = useGetAddonListQuery()

  const versions = useMemo(() => {
    if (isLoading || isError) return []

    const addon = data.find((i) => i.name === addonName)
    if (!addon) {
      toast.error(`Addon ${addonName} not found`)
      return []
    }

    const result = []
    for (const version in addon.versions) {
      result.push({ value: version, label: `${addon.title} ${version}` })
    }

    return result
  }, [data, isLoading, isError, addonName])

  return (
    <Dropdown
      value={addonVersion ? [addonVersion] : null}
      options={versions}
      onChange={(e) => setAddonVersion(e[0])}
      placeholder="Select addon version"
      style={{ flexGrow: 1, minWidth: '300px' }}
      disabled={disabled}
    />
  )
}

export default AddonDropdown

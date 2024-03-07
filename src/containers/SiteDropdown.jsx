import ayonClient from '/src/ayon'
import { useMemo } from 'react'
import { Dropdown } from '@ynput/ayon-react-components'

const SiteDropdown = ({ value, onChange, disabled, multiselect = false, allowNull = false }) => {
  const siteOptions = useMemo(() => {
    const sites = []
    sites.push(...ayonClient.settings.sites.map((site) => ({ value: site.id, label: site.id })))
    return sites
  }, [])

  return (
    <Dropdown
      value={value ? [value] : null}
      options={siteOptions}
      multiSelect={multiselect}
      onChange={(e) => (multiselect ? onChange(e) : onChange(e[0]))}
      onClear={() => (allowNull ? onChange(null) : undefined)}
      onClearNullValue={allowNull}
      placeholder="Select a site"
      style={{ flexGrow: 1 }}
      disabled={disabled}
    />
  )
}

export default SiteDropdown

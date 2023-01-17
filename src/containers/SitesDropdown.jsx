import ayonClient from '/src/ayon'
import { Dropdown } from 'primereact/dropdown'

import { useMemo } from 'react'

const SitesDropdown = ({ value, onChange }) => {
  const siteOptions = useMemo(() => {
    const options = []
    for (const site of ayonClient.settings.sites) {
      options.push({ label: site.hostname, value: site.id })
    }
    return options
  }, [])

  return (
    <Dropdown
      options={siteOptions}
      value={value}
      optionLabel="label"
      optionValue="value"
      onChange={(e) => onChange(e.value)}
    />
  )
}

export default SitesDropdown

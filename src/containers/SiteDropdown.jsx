import ayonClient from '@/ayon'
import { useMemo, useEffect } from 'react'
import { Dropdown } from '@ynput/ayon-react-components'
import useLocalStorage from '@hooks/useLocalStorage'

const SiteDropdown = ({ value, onChange, disabled, multiselect = false, allowNull = false }) => {
  const [preferredSite, setPreferredSite] = useLocalStorage('prefferedSite', null)

  const siteOptions = useMemo(() => {
    const sites = []
    sites.push(...ayonClient.settings.sites.map((site) => ({ value: site.id, label: site.id })))
    return sites
  }, [])

  useEffect(() => {
    if (!value && preferredSite && siteOptions.find((site) => site.value === preferredSite))
      onChange(multiselect ? [preferredSite] : preferredSite)
  }, [preferredSite])

  const handleChange = (e) => {
    const val = multiselect ? e : e[0]
    setPreferredSite(val)
    onChange(val)
  }

  return (
    <Dropdown
      value={value ? [value] : null}
      options={siteOptions}
      multiSelect={multiselect}
      onChange={handleChange}
      onClearNull={allowNull ? () => onChange(null) : null}
      placeholder="Select a site"
      style={{ flexGrow: 1 }}
      disabled={disabled}
    />
  )
}

export default SiteDropdown

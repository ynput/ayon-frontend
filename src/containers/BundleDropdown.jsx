import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Dropdown } from '@ynput/ayon-react-components'

import { useGetBundleListQuery } from '/src/services/bundles/getBundles'
import styled from 'styled-components'

const BundleDropdownItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
`

const DropdownBadge = styled.span`
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: black;
`

const BundleDropdown = ({ bundleName, setBundleName, disabled, style, setVariant, exclude }) => {
  const { data, isLoading, isError } = useGetBundleListQuery({})
  const userName = useSelector((state) => state.user.name)
  const devMode = useSelector((state) => state.user.attrib.developerMode)

  const formatBundleDropdownItem = (bundle) => {
    let prodBadge = null
    let stagBadge = null
    let devBadge = null

    if (bundle.isProduction) {
      prodBadge = (
        <DropdownBadge style={{ backgroundColor: 'var(--color-hl-production)' }}>
          Production
        </DropdownBadge>
      )
    }
    if (bundle.isStaging) {
      stagBadge = (
        <DropdownBadge style={{ backgroundColor: 'var(--color-hl-staging)' }}>
          Staging
        </DropdownBadge>
      )
    }

    if (devMode && bundle.isDev) {
      devBadge = (
        <DropdownBadge style={{ backgroundColor: 'var(--color-hl-developer)' }}>
          {bundle.activeUser === userName ? 'Active' : 'Dev'}
        </DropdownBadge>
      )
    }

    return (
      <BundleDropdownItem>
        {bundle.value}{' '}
        <span>
          {prodBadge} {stagBadge} {devBadge}
        </span>
      </BundleDropdownItem>
    )
  }

  const bundleFilter = (b) => {
    if (exclude?.length && exclude.includes(b.name)) return false
    if (b.isDev && !devMode) return false
    return true
  }

  const bundleOptions = useMemo(() => {
    if (isLoading || isError) return []
    return data.filter(bundleFilter).map((bundle) => ({
      value: bundle.name,
      label: bundle.name,
      isProduction: bundle.isProduction,
      isStaging: bundle.isStaging,
      isDev: bundle.isDev,
      activeUser: bundle.activeUser,
    }))
  }, [data])

  const handleChange = (e) => {
    const selectedBundle = bundleOptions.find((b) => b.value === e[0])
    if (!selectedBundle) return

    if (setBundleName) setBundleName(selectedBundle.value)
    if (setVariant) {
      if (selectedBundle.isDev) setVariant(selectedBundle.value)
      else if (selectedBundle.isProduction) setVariant('production')
      else if (selectedBundle.isStaging) setVariant('staging')
      else {
        setVariant('production')
      }
    }
  }

  return (
    <Dropdown
      value={bundleName ? [bundleName] : null}
      options={bundleOptions}
      onChange={handleChange}
      placeholder="Select a bundle"
      style={style || { flexGrow: 1 }}
      disabled={disabled}
      itemTemplate={formatBundleDropdownItem}
    />
  )
}

export default BundleDropdown

import { useMemo } from 'react'
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

const formatBundleDropdownItem = (bundle) => {
  let prodBadge = null
  let stagBadge = null
  if (bundle.isProduction) {
    prodBadge = (
      <DropdownBadge style={{ backgroundColor: 'var(--color-hl-production)' }}>
        Production
      </DropdownBadge>
    )
  }
  if (bundle.isStaging) {
    stagBadge = (
      <DropdownBadge style={{ backgroundColor: 'var(--color-hl-staging)' }}>Staging</DropdownBadge>
    )
  }

  return (
    <BundleDropdownItem>
      {bundle.value}{' '}
      <span>
        {prodBadge} {stagBadge}
      </span>
    </BundleDropdownItem>
  )
}

const BundleDropdown = ({ bundleName, setBundleName, disabled, style }) => {
  const { data, isLoading, isError } = useGetBundleListQuery({})

  const bundleOptions = useMemo(() => {
    if (isLoading || isError) return []
    return data.map((bundle) => ({
      value: bundle.name,
      label: bundle.name,
      isProduction: bundle.isProduction,
      isStaging: bundle.isStaging,
    }))
  }, [data])

  return (
    <Dropdown
      value={bundleName ? [bundleName] : null}
      options={bundleOptions}
      onChange={(e) => setBundleName(e[0])}
      placeholder="Select a bundle"
      style={style || { flexGrow: 1 }}
      disabled={disabled}
      itemTemplate={formatBundleDropdownItem}
    />
  )
}

export default BundleDropdown

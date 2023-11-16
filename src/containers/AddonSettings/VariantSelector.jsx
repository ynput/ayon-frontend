import { Button, Dropdown } from '@ynput/ayon-react-components'
import { useSelector } from 'react-redux'
import { useMemo, useEffect } from 'react'
import { useGetBundleListQuery } from '/src/services/bundles'
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
  background-color: var(--color-hl-developer);
  margin-left: 8px;
`

const DevModeSelector = ({ variant, setVariant, disabled }) => {
  const { data } = useGetBundleListQuery({})
  const userName = useSelector((state) => state.user.name)

  const bundleList = useMemo(() => {
    return [
      { label: 'Production', name: 'production' },
      { label: 'Staging', name: 'staging' },
      ...(data || []).filter((b) => !b?.isArchived && b?.isDev),
    ]
  }, [data])

  const bundleOptions = useMemo(() => {
    return bundleList.map((b) => ({
      label: b.label || b.name,
      value: b.name,
      active: b.activeUser === userName,
    }))
  }, [bundleList])

  useEffect(() => {
    // Bundle preselection
    const selectedBundle = bundleList.find((b) => b.name === variant)
    if (!selectedBundle) {
      const userBundle = bundleList.find((b) => b.activeUser === userName)
      if (userBundle) return setVariant(userBundle.name)
      else return setVariant(bundleList[0].name)
    }
  }, [bundleList, variant])

  return (
    <Dropdown
      options={bundleOptions}
      value={[variant]}
      onChange={(e) => setVariant(e[0])}
      disabled={disabled}
      style={{ flexGrow: 1 }}
      itemTemplate={(option) => (
        <BundleDropdownItem>
          <span>
            {option.label}
            {option.active && <DropdownBadge>A</DropdownBadge>}
          </span>
        </BundleDropdownItem>
      )}
    />
  )
}

const VariantSelector = ({ variant, setVariant, disabled }) => {
  const user = useSelector((state) => state.user)

  useEffect(() => {
    if (!user.attrib.developerMode && !['staging', 'production'].includes(variant)) {
      setVariant('production')
    }
  }, [user.attrib.developerMode])

  if (user.attrib.developerMode) {
    return <DevModeSelector variant={variant} setVariant={setVariant} disabled={disabled} />
  }

  const styleHlProd = {
    backgroundColor: 'var(--color-hl-production)',
    color: 'black',
  }
  const styleHlStag = {
    backgroundColor: 'var(--color-hl-staging)',
    color: 'black',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
      <Button
        label="Production"
        onClick={() => setVariant('production')}
        style={variant === 'production' ? styleHlProd : {}}
        disabled={disabled}
      />
      <Button
        label="Staging"
        onClick={() => setVariant('staging')}
        style={variant === 'staging' ? styleHlStag : {}}
        disabled={disabled}
      />
    </div>
  )
}

export default VariantSelector

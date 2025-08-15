import { Button, Dropdown } from '@ynput/ayon-react-components'
import { useSelector } from 'react-redux'
import { useMemo, useEffect, CSSProperties, ReactNode } from 'react'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import styled from 'styled-components'
import type { RootState } from '@state/store'
import type { BundleModel } from '@shared/api/generated/bundles'

// Type definitions
type BundleWithDefaults = BundleModel | { label: string; name: string }

interface BundleOption {
  label: string
  value: string
  active: boolean
}

interface VariantSelectorProps {
  variant: string
  setVariant: (variant: string) => void
  disabled?: boolean
  style?: CSSProperties
}

type DevModeSelectorProps = VariantSelectorProps

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

const DevModeSelector = ({ variant, setVariant, disabled, style }: DevModeSelectorProps) => {
  const { data: { bundles = [] } = {} } = useListBundlesQuery({})
  const userName = useSelector((state: RootState) => state.user.name)

  const bundleList = useMemo<BundleWithDefaults[]>(() => {
    return [
      { label: 'Production', name: 'production' },
      { label: 'Staging', name: 'staging' },
      ...(bundles || []).filter((b) => !b?.isArchived && b?.isDev),
    ]
  }, [bundles])

  const bundleOptions = useMemo<BundleOption[]>(() => {
    return bundleList.map((b) => ({
      label: 'label' in b ? b.label : b.name,
      value: b.name,
      active: 'activeUser' in b ? b.activeUser === userName : false,
    }))
  }, [bundleList, userName])

  const dropdownStyle = style || { flexGrow: 1 }

  const formatValue = (value: string[]): ReactNode => {
    if (!bundleOptions.length) return ''
    if (!value.length) return ''
    const selectedBundle = bundleOptions.find((b) => b.value === value[0])
    if (!selectedBundle) return ''
    return (
      <BundleDropdownItem>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedBundle.label}
        </span>
        <span>
          {selectedBundle.active && <DropdownBadge>A</DropdownBadge>}
          {selectedBundle.value === 'staging' && (
            <DropdownBadge style={{ backgroundColor: 'var(--color-hl-staging)' }}>S</DropdownBadge>
          )}
          {selectedBundle.value === 'production' && (
            <DropdownBadge style={{ backgroundColor: 'var(--color-hl-production)' }}>
              P
            </DropdownBadge>
          )}
        </span>
      </BundleDropdownItem>
    )
  }

  useEffect(() => {
    // Bundle preselection
    if (!bundleList.length) return
    const userBundle = bundleList.find(
      (b): b is BundleModel => 'activeUser' in b && b.activeUser === userName,
    )
    if (userBundle) setVariant(userBundle.name)
    else setVariant(bundleList[0].name)
  }, [bundleList, userName, setVariant])

  return (
    <Dropdown
      options={bundleOptions}
      value={[variant]}
      onChange={(e) => setVariant(e[0])}
      disabled={disabled}
      style={dropdownStyle}
      valueTemplate={formatValue}
      itemTemplate={(option: BundleOption) => (
        <BundleDropdownItem>
          {option.label}
          <span>
            {option.active && <DropdownBadge>A</DropdownBadge>}
            {option.value === 'staging' && (
              <DropdownBadge style={{ backgroundColor: 'var(--color-hl-staging)' }}>
                S
              </DropdownBadge>
            )}
            {option.value === 'production' && (
              <DropdownBadge style={{ backgroundColor: 'var(--color-hl-production)' }}>
                P
              </DropdownBadge>
            )}
          </span>
        </BundleDropdownItem>
      )}
    />
  )
}

const VariantSelector = ({
  variant,
  setVariant,
  disabled = false,
  style,
}: VariantSelectorProps) => {
  const user = useSelector((state: RootState) => state.user)

  useEffect(() => {
    if (!user.attrib.developerMode && !['staging', 'production'].includes(variant)) {
      setVariant('production')
    }
  }, [user.attrib.developerMode, variant, setVariant])

  if (user.attrib.developerMode) {
    return (
      <DevModeSelector
        variant={variant}
        setVariant={setVariant}
        disabled={disabled}
        style={style}
      />
    )
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

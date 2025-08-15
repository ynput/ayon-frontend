import { Button, Dropdown } from '@ynput/ayon-react-components'
import { useAppSelector } from '@state/store'
import { useMemo, useEffect, CSSProperties, ReactNode } from 'react'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import styled from 'styled-components'
import type { BundleModel } from '@shared/api/generated/bundles'

type BundleType = 'production' | 'staging' | 'dev'

interface BundleOption {
  label: string
  value: string
  active: boolean
  type: BundleType
  createdAt?: string
}

const BUNDLE_TYPE_ORDER: Record<BundleType, number> = {
  production: 0,
  staging: 1,
  dev: 2,
}

const BUNDLE_BADGES: Record<BundleType, { label: string; className?: string }> = {
  production: { label: 'P', className: 'production' },
  staging: { label: 'S', className: 'staging' },
  dev: { label: 'D' },
}

interface VariantSelectorProps {
  variant: string
  setVariant: (variant: string) => void
  disabled?: boolean
  style?: CSSProperties
}

type DevModeSelectorProps = VariantSelectorProps

// Utility functions
const getBundleType = (bundle: BundleModel): BundleType => {
  if (bundle.isProduction) return 'production'
  if (bundle.isStaging) return 'staging'
  return 'dev'
}

const compareBundles = (a: BundleOption, b: BundleOption): number => {
  // First sort by type priority
  const typeDiff = BUNDLE_TYPE_ORDER[a.type] - BUNDLE_TYPE_ORDER[b.type]
  if (typeDiff !== 0) return typeDiff

  // Within same type, sort by createdAt (newest first)
  if (a.createdAt && b.createdAt) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  }

  // Fallback to name sorting
  return a.label.localeCompare(b.label)
}

const BundleDropdownItemContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  flex: 1;
`

export const DropdownBadge = styled.span`
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: black;
  background-color: var(--color-hl-developer);
  margin-left: 8px;
  height: 18px;
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.staging {
    background-color: var(--color-hl-staging);
  }

  &.production {
    background-color: var(--color-hl-production);
  }
`

interface DropdownBundleItemProps {
  bundle: BundleOption
}

const BundleLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const BadgeContainer = styled.span`
  display: flex;
  gap: 4px;
`

const DropdownBundleItem = ({ bundle }: DropdownBundleItemProps) => {
  const typeBadge = BUNDLE_BADGES[bundle.type]

  return (
    <BundleDropdownItemContainer>
      <BundleLabel>{bundle.label}</BundleLabel>
      <BadgeContainer>
        {bundle.active && <DropdownBadge>A</DropdownBadge>}
        <DropdownBadge className={typeBadge.className}>{typeBadge.label}</DropdownBadge>
      </BadgeContainer>
    </BundleDropdownItemContainer>
  )
}

const DevModeSelector = ({ variant, setVariant, disabled, style }: DevModeSelectorProps) => {
  const { data: { bundles = [] } = {} } = useListBundlesQuery({})
  const userName = useAppSelector((state) => state.user.name)

  const bundleList = useMemo<BundleModel[]>(() => {
    return bundles.filter((b) => !b?.isArchived && (b?.isProduction || b?.isStaging || b?.isDev))
  }, [bundles])

  const bundleOptions = useMemo<BundleOption[]>(() => {
    return bundleList
      .map((bundle) => ({
        label: bundle.name,
        value: bundle.name,
        active: 'activeUser' in bundle ? bundle.activeUser === userName : false,
        type: getBundleType(bundle),
        createdAt: bundle.createdAt,
      }))
      .sort(compareBundles)
  }, [bundleList, userName])

  const dropdownStyle = style || { flexGrow: 1 }

  const formatValue = (value: string[]): ReactNode => {
    if (!bundleOptions.length) return ''
    if (!value.length) return ''
    const selectedBundle = bundleOptions.find((b) => b.value === value[0])
    if (!selectedBundle) return ''
    return <DropdownBundleItem bundle={selectedBundle} />
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
      itemTemplate={(option: BundleOption) => <DropdownBundleItem bundle={option} />}
    />
  )
}

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 6px;
`

const VARIANT_STYLES = {
  production: {
    backgroundColor: 'var(--color-hl-production)',
    color: 'black',
  },
  staging: {
    backgroundColor: 'var(--color-hl-staging)',
    color: 'black',
  },
} as const

const VariantSelector = ({
  variant,
  setVariant,
  disabled = false,
  style,
}: VariantSelectorProps) => {
  const user = useAppSelector((state) => state.user)

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

  return (
    <ButtonContainer>
      {(['production', 'staging'] as const).map((variantType) => (
        <Button
          key={variantType}
          label={variantType.charAt(0).toUpperCase() + variantType.slice(1)}
          onClick={() => setVariant(variantType)}
          style={variant === variantType ? VARIANT_STYLES[variantType] : {}}
          disabled={disabled}
        />
      ))}
    </ButtonContainer>
  )
}

export default VariantSelector

import { Dropdown } from '@ynput/ayon-react-components'
import { useAppSelector } from '@state/store'
import { useMemo } from 'react'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import styled from 'styled-components'
import type { BundleModel } from '@shared/api/generated/bundles'
import clsx from 'clsx'

type BundleType = 'production' | 'staging' | 'dev' | 'project' | 'default'

interface BundleOption {
  label: string
  value: string
  isDevMine?: boolean // Indicates if the bundle is a dev bundle owned by the current user
  isProduction?: boolean
  isStaging?: boolean
  type: BundleType
  createdAt?: string
}

const BUNDLE_TYPE_ORDER: Record<BundleType, number> = {
  production: 0,
  staging: 1,
  dev: 2,
  project: 3,
  default: 4, // For any other types that might be added in the future
}

const BUNDLE_BADGES: Record<BundleType, { label?: string; className?: string }> = {
  production: { label: 'P', className: 'production' },
  staging: { label: 'S', className: 'staging' },
  dev: { label: 'Dev' },
  project: { label: 'Project', className: 'project' },
  default: {},
}

// Utility functions
const getBundleType = (bundle: BundleModel): BundleType => {
  if (bundle.isProduction) return 'production'
  if (bundle.isStaging) return 'staging'
  if (bundle.isDev) return 'dev'
  if (bundle.isProject) return 'project'
  return 'default'
}

const compareBundles = (a: BundleOption, b: BundleOption): number => {
  // First, prioritize 'isDevMine' when both are dev bundles
  if (a.type === 'dev' && b.type === 'dev') {
    if (a.isDevMine && !b.isDevMine) return -1 // a comes first
    if (!a.isDevMine && b.isDevMine) return 1 // b comes first
  }

  // Then sort by type priority
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

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
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
  min-width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.staging {
    background-color: var(--color-hl-staging);
  }

  &.production {
    background-color: var(--color-hl-production);
  }

  &.project {
    background-color: var(--color-hl-project);
  }
`

const BundleLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const BadgeContainer = styled.span`
  display: flex;
  gap: 4px;
`

interface DropdownBundleItemProps {
  bundle?: BundleOption
  isSelected?: boolean
}

const DropdownBundleItem = ({ bundle, isSelected }: DropdownBundleItemProps) => {
  if (!bundle) return <BundleDropdownItemContainer>Select a bundle...</BundleDropdownItemContainer>

  const typeBadge = BUNDLE_BADGES[bundle.type]

  return (
    <BundleDropdownItemContainer className={clsx({ selected: isSelected })}>
      <BundleLabel>{bundle.label}</BundleLabel>
      {bundle.type !== 'default' && (
        <BadgeContainer>
          <DropdownBadge className={typeBadge.className}>
            {typeBadge.label}
            {bundle.isDevMine ? ' (me)' : ''}
          </DropdownBadge>
        </BadgeContainer>
      )}
    </BundleDropdownItemContainer>
  )
}

export interface BundleIdentifier {
  bundleName?: string
  projectBundleName?: string
  variant?: string
}

interface BundlesSelectorProps {
  selected: BundleIdentifier
  onChange: (value: BundleIdentifier) => void
  disabled?: boolean
}

const BundlesSelector = ({ selected, onChange, disabled }: BundlesSelectorProps) => {
  const { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: false })
  const userName = useAppSelector((state) => state.user.name)
  const devMode = useAppSelector((state) => state.user.attrib.developerMode)

  console.debug('selected bundle: ', selected)

  const bundleOptions = useMemo<BundleOption[]>(() => {
    return bundles
      .filter(
        (b) => devMode /* IDK: is this a good idea? && b.activeUser === userName*/ || !b?.isDev,
      )
      .map((bundle) => ({
        label: bundle.name,
        value: bundle.name,
        isDevMine: bundle.isDev && bundle.activeUser === userName,
        isProduction: bundle.isProduction,
        isStaging: bundle.isStaging,
        type: getBundleType(bundle),
        createdAt: bundle.createdAt,
      }))
      .sort(compareBundles)
  }, [bundles, devMode, userName])

  const selectedBundle = useMemo(() => {
    const { bundleName, projectBundleName, variant } = selected

    // If no bundle is explicitly selected, try to match by variant type
    if (!bundleName && !projectBundleName) {
      if (variant === 'production') {
        return bundleOptions.find((b) => b.isProduction)
      }
      if (variant === 'staging') {
        return bundleOptions.find((b) => b.isStaging)
      }
    }

    // Find bundle by name (project bundle takes precedence)
    const selectedValue = projectBundleName || bundleName || variant
    return bundleOptions.find((b) => b.value === selectedValue)
  }, [selected, bundleOptions])

  console.log(bundleOptions, selected)

  const handleOnChange = (bundle: string) => {
    // find bundle object
    const selectedBundle = bundleOptions.find((b) => b.value === bundle)
    if (!selectedBundle) return

    // if the bundle is staging or production, set the variant instead of bundle name
    if (selectedBundle.type === 'staging' || selectedBundle.type === 'production') {
      onChange({
        variant: selected.variant,
        bundleName: selectedBundle.value,
        projectBundleName: undefined,
      })
    } else if (selectedBundle.type === 'project') {
      onChange({
        variant: selected.variant,
        bundleName: undefined,
        projectBundleName: selectedBundle.value,
      })
    } else if (selectedBundle.type === 'dev') {
      onChange({
        bundleName: selectedBundle.value,
        variant: selectedBundle.value,
        projectBundleName: undefined,
      })
    } else {
      onChange({
        bundleName: selectedBundle.value,
        variant: selected.variant,
        projectBundleName: undefined,
      })
    }
  }

  return (
    <Dropdown
      options={bundleOptions}
      value={selectedBundle ? [selectedBundle?.value] : []}
      style={{ width: '100%' }}
      onChange={(e) => handleOnChange(e[0])}
      valueTemplate={() => <DropdownBundleItem bundle={selectedBundle} />}
      itemTemplate={(option: BundleOption, _, isSelected) => (
        <DropdownBundleItem bundle={option} isSelected={isSelected} />
      )}
      searchOnNumber={10}
      disabled={disabled}
      placeholder="No bundle selected"
    />
  )
}

export default BundlesSelector

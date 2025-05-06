import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { DefaultValueTemplate, Dropdown, DropdownProps } from '@ynput/ayon-react-components'

import { useListBundlesQuery } from '@queries/bundles/getBundles'
import styled from 'styled-components'
import { BundleModel } from '@shared/api'
import { $Any } from '@types'
import clsx from 'clsx'

export const BundleDropdownItemStyled = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  padding-right: 12px;
  gap: var(--base-gap-small);

  &.active {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);

    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
  }
`

export const DefaultValueTemplateStyled = styled(DefaultValueTemplate)`
  padding-left: 0;
  & > div > span {
    flex: 1;
  }
`

const BadgesWrapper = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

const DropdownBadge = styled.span`
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: black;

  &.disabled {
    /* strikethrough text */
    text-decoration: line-through;
  }
`

export type BundleOption = {
  value: string
  label: string
  isProduction?: boolean
  isStaging?: boolean
  isDev?: boolean
  activeUser?: string
  previous?: string | null
}

type BundleBadgesProps = {
  bundle: BundleOption
  devMode: boolean
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  previous?: BundleOption['previous']
}

export const BundleBadges = ({
  bundle,
  devMode,
  startContent,
  endContent,
  previous,
}: BundleBadgesProps) => {
  const userName = useSelector((state: $Any) => state.user.name)

  let prodBadge = null
  let stagBadge = null
  let devBadge = null

  if (bundle.isProduction) {
    prodBadge = (
      <DropdownBadge
        className={clsx('badge', { disabled: previous === 'production' })}
        style={{ backgroundColor: 'var(--color-hl-production)' }}
      >
        {startContent}
        Production
        {endContent}
      </DropdownBadge>
    )
  }
  if (bundle.isStaging) {
    stagBadge = (
      <DropdownBadge
        className={clsx('badge', { disabled: previous === 'staging' })}
        style={{ backgroundColor: 'var(--color-hl-staging)' }}
      >
        {startContent}
        Staging
        {endContent}
      </DropdownBadge>
    )
  }

  if (devMode && bundle.isDev) {
    devBadge = (
      <DropdownBadge
        className={clsx('badge', { disabled: previous === 'dev' })}
        style={{ backgroundColor: 'var(--color-hl-developer)' }}
      >
        {startContent}
        {bundle.activeUser === userName ? 'Active' : 'Dev'}
        {endContent}
      </DropdownBadge>
    )
  }

  return (
    <BadgesWrapper>
      {prodBadge} {stagBadge} {devBadge}
    </BadgesWrapper>
  )
}

type BundleDropdownItemProps = {
  bundle?: BundleOption
  devMode: boolean
  isActive?: boolean
}

export const BundleDropdownItem = ({ bundle, devMode, isActive }: BundleDropdownItemProps) => {
  return (
    <BundleDropdownItemStyled className={clsx({ active: isActive })}>
      {bundle?.label}
      {bundle && <BundleBadges bundle={bundle} devMode={devMode} previous={bundle.previous} />}
    </BundleDropdownItemStyled>
  )
}

interface BundleDropdownProps extends Omit<DropdownProps, 'value' | 'options'> {
  bundleName: string
  setBundleName: (bundleName: string) => void
  disabled?: boolean
  style?: React.CSSProperties
  setVariant?: (variant: string) => void
  exclude?: string[]
  activeOnly?: boolean // only show production, staging, and dev bundles
}

const BundleDropdown = ({
  bundleName,
  setBundleName,
  disabled,
  style,
  setVariant,
  exclude,
  activeOnly,
  ...props
}: BundleDropdownProps) => {
  const { data: { bundles = [] } = {}, isLoading, isError } = useListBundlesQuery({})
  const devMode = useSelector((state: $Any) => state.user.attrib.developerMode)

  const bundleFilter = (b: BundleModel) => {
    if (exclude?.length && exclude.includes(b.name)) return false
    if (b.isDev && !devMode) return false
    if (activeOnly && !b.isProduction && !b.isStaging && !b.isDev) return false
    return true
  }

  const bundleOptions = useMemo(() => {
    if (isLoading || isError) return []
    return bundles.filter(bundleFilter).map((bundle) => ({
      value: bundle.name,
      label: bundle.name,
      isProduction: bundle.isProduction,
      isStaging: bundle.isStaging,
      isDev: bundle.isDev,
      activeUser: bundle.activeUser,
    }))
  }, [bundles])

  const handleChange = (v: string[]) => {
    const selectedBundle = bundleOptions.find((b) => b.value === v[0])
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
      style={style || { flex: 1 }}
      disabled={disabled}
      valueTemplate={(value, _selected, isOpen) => (
        <DefaultValueTemplateStyled value={value} isOpen={isOpen}>
          <BundleDropdownItem
            bundle={bundleOptions.find((b) => b.value === value[0])}
            devMode={devMode}
          />
        </DefaultValueTemplateStyled>
      )}
      itemTemplate={(bundle, isActive) => (
        <BundleDropdownItem bundle={bundle} devMode={devMode} isActive={isActive} />
      )}
      {...props}
    />
  )
}

export default BundleDropdown

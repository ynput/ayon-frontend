import { BundleModel } from '@api/rest/bundles'
import {
  BundleDropdownItem,
  BundleOption,
  DefaultValueTemplateStyled,
} from '@containers/BundleDropdown'
import { $Any } from '@types'
import { Dropdown, DropdownProps } from '@ynput/ayon-react-components'
import { FC, useMemo } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

const StyledDropdown = styled(Dropdown)`
  button {
    background-color: unset;
    .template-value {
      border: none;
    }
  }
`

export type SourceBundle = BundleModel & { previous?: boolean }

interface CopyBundleSettingsDropdownProps
  extends Omit<DropdownProps, 'value' | 'options' | 'onChange'> {
  bundles: SourceBundle[]
  bundle: string | null
  exclude?: string[]
  variant: string
  onBundleChange: (bundle: string, variant: string) => void
}

const CopyBundleSettingsDropdown: FC<CopyBundleSettingsDropdownProps> = ({
  bundle,
  variant,
  bundles,
  onBundleChange,
  exclude,
  ...props
}) => {
  const devMode = useSelector((state: $Any) => state.user.attrib.developerMode)

  const bundleFilter = (b: BundleModel) => b.isProduction || b.isStaging || (b.isDev && devMode)

  let bundleOptions: BundleOption[] = useMemo(() => {
    return bundles.filter(bundleFilter).map((bundle) => ({
      value: bundle.name,
      label: bundle.name,
      isProduction: bundle.isProduction,
      isStaging: bundle.isStaging,
      isDev: bundle.isDev,
      previous: !!bundle.previous,
    }))
  }, [bundles])

  //   if a bundle isProduction and isStaging, split it into two options
  bundleOptions = bundleOptions.reduce((acc, b) => {
    if (b.isProduction && b.isStaging) {
      acc.push({ ...b, isStaging: false })
      acc.push({ ...b, isProduction: false })
    } else {
      acc.push(b)
    }
    return acc
  }, [] as BundleOption[])

  // add variant suffix to bundle name
  bundleOptions = bundleOptions.map((b) => {
    if (b.isDev) {
      return { ...b, value: `${b.value}__dev` }
    }
    if (b.isProduction) {
      return { ...b, value: `${b.value}__production` }
    }
    if (b.isStaging) {
      return { ...b, value: `${b.value}__staging` }
    }
    return b
  })

  // filter out self (exclude)
  bundleOptions = bundleOptions.filter((b) => !exclude?.includes(b.value))

  const handleBundleChange = (v: string[]) => {
    const splitIndex = v[0].lastIndexOf('__')
    const bundle = v[0].substring(0, splitIndex)
    const variant = v[0].substring(splitIndex + 2)
    onBundleChange(bundle, variant)
  }

  let value = [bundle + '__' + variant]
  if (!bundle) value = [bundleOptions[0].value]

  return (
    <StyledDropdown
      value={value}
      options={bundleOptions}
      onChange={handleBundleChange}
      placeholder="Select a bundle"
      style={{ flex: 1 }}
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

export default CopyBundleSettingsDropdown

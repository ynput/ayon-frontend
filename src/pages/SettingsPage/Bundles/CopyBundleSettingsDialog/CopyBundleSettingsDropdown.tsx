import { BundleModel } from '@api/rest/bundles'
import {
  BundleDropdownItem,
  BundleOption,
  DefaultValueTemplateStyled,
} from '@containers/BundleDropdown'
import { Dropdown, DropdownProps } from '@ynput/ayon-react-components'
import { FC, useEffect, useMemo } from 'react'
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
  devMode: boolean
  bundles: SourceBundle[]
  bundleValue: string | null
  variantValue: string
  exclude?: string[]
  onError: () => void
  onBundleChange: (bundleValue: string, variantValue: string) => void
}

const CopyBundleSettingsDropdown: FC<CopyBundleSettingsDropdownProps> = ({
  devMode,
  bundleValue,
  variantValue,
  bundles,
  onBundleChange,
  exclude,
  onError,
  ...props
}) => {
  const bundleFilter = (b: BundleModel) => b.isProduction || b.isStaging || (b.isDev && devMode)

  // filter out bundles that are not production, staging, or dev
  // create options objects for the dropdown
  let bundleOptions: BundleOption[] = useMemo(() => {
    return bundles.filter(bundleFilter).map((bundle) => ({
      value: bundle.name,
      label: bundle.name,
      isProduction: bundle.isProduction,
      isStaging: bundle.isStaging,
      isDev: bundle.isDev,
      previous: !!bundle.previous ? variantValue : null,
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
    const bundleValue = v[0].substring(0, splitIndex)
    const variantValue = v[0].substring(splitIndex + 2)
    onBundleChange(bundleValue, variantValue)
  }

  // if bundleValue and variantValue are not set or invalid, default to first option
  useEffect(() => {
    const foundBundle = bundleOptions.find((b) => b.value === bundleValue + '__' + variantValue)

    if (foundBundle) return
    if (bundleOptions.length) {
      const firstOption = bundleOptions[0]
      handleBundleChange([firstOption.value])
    }
  }, [bundleValue, variantValue, bundleOptions, onBundleChange])

  let value = [bundleValue + '__' + variantValue]
  if (!bundleValue && bundleOptions[0]) value = [bundleOptions[0].value]

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

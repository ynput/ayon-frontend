import { Button, Dropdown } from '@ynput/ayon-react-components'
import { useSelector } from 'react-redux'
import { useMemo, useEffect } from 'react'

import { useGetBundleListQuery } from '/src/services/bundles'

const DevModeSelector = ({ variant, setVariant, disabled }) => {
  const { data: bundleList } = useGetBundleListQuery({})
  const userName = useSelector((state) => state.user.name)

  const bundleOptions = useMemo(() => {
    if (!bundleList?.length) return []
    const bundles = bundleList.filter((b) => !b?.isArchived && b?.isDev)
    return bundles.map((b) => ({ label: b.name, value: b.name }))
  }, [bundleList])

  useEffect(() => {
    // Bundle preselection
    if (!bundleList?.length) return
    const bundles = bundleList.filter((b) => !b?.isArchived && b?.isDev)
    if (!bundles.length) return
    const selectedBundle = bundles.find((b) => b.name === variant)
    if (!selectedBundle) {
      const userBundle = bundles.find((b) => b.activeUser === userName)
      if (userBundle) return setVariant(userBundle.name)
      else return setVariant(bundles[0].name)
    }
  }, [bundleList, variant])

  return (
    <Dropdown
      options={bundleOptions}
      value={[variant]}
      onChange={(e) => setVariant(e[0])}
      disabled={disabled}
      style={{ flex: 1 }}
    />
  )
}

const VariantSelector = ({ variant, setVariant, disabled }) => {
  const user = useSelector((state) => state.user)

  if (user.attrib.developerMode)
    return <DevModeSelector variant={variant} setVariant={setVariant} disabled={disabled} />

  const styleHlProd = {
    backgroundColor: 'var(--color-hl-production)',
    color: 'black',
  }
  const styleHlStag = {
    backgroundColor: 'var(--color-hl-staging)',
    color: 'black',
  }

  return (
    <>
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
    </>
  )
}

export default VariantSelector

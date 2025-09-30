import { Button } from '@ynput/ayon-react-components'
import { useAppSelector } from '@state/store'
import styled from 'styled-components'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { toast } from 'react-toastify'
import { useMemo } from 'react'

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
  dev: {
    backgroundColor: 'var(--color-hl-developer)',
    color: 'black',
  },
} as const

interface VariantSelectorProps {
  variant: string
  setVariant: (variant: string) => void
  disabled?: boolean
  showDev?: boolean
}

const VariantSelector = ({
  variant,
  setVariant,
  showDev = false,
  disabled = false,
}: VariantSelectorProps) => {
  const { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: false })
  const devMode = useAppSelector((state) => state.user.attrib.developerMode)
  const userName = useAppSelector((state) => state.user.name)

  const buttons =
    devMode && showDev
      ? (['production', 'staging', 'dev'] as const)
      : (['production', 'staging'] as const)

  const selectedBundle = useMemo(() => {
    if (variant === 'production') {
      return bundles.find((b) => b.isProduction)
    } else if (variant === 'staging') {
      return bundles.find((b) => b.isStaging)
    }
    return bundles.find((b) => b.name === variant)
  }, [variant, bundles])

  // resolve which buttons is selected
  const selectedType = useMemo(() => {
    if (selectedBundle?.isProduction) return 'production'
    if (selectedBundle?.isStaging) return 'staging'
    if (selectedBundle?.isDev && selectedBundle.activeUser === userName) return 'dev'
    return undefined
  }, [selectedBundle])

  const handleOnChange = (variant: (typeof buttons)[number]) => {
    if (variant === 'dev') {
      // find dev bundle that belongs to the user
      const devBundle = bundles.find((bundle) => bundle.isDev && bundle.activeUser === userName)
      if (devBundle) {
        setVariant(devBundle.name)
      } else {
        toast.warn('No dev bundle found for your user. Please create one first.')
      }
    } else {
      setVariant(variant)
    }
  }

  return (
    <ButtonContainer>
      {buttons.map((variantType) => (
        <Button
          key={variantType}
          label={variantType.charAt(0).toUpperCase() + variantType.slice(1)}
          onClick={() => handleOnChange(variantType)}
          style={variantType === selectedType ? VARIANT_STYLES[variantType] : {}}
          disabled={disabled}
        />
      ))}
    </ButtonContainer>
  )
}

export default VariantSelector

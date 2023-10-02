import { Button } from '@ynput/ayon-react-components'
import { useSelector } from 'react-redux'

const DevModeSelector = ({ variant, setVariant, disabled }) => {
  return JSON.stringify({ variant, setVariant, disabled })
}

const VariantSelector = ({ variant, setVariant, disabled }) => {
  const user = useSelector((state) => state.user)

  if (user.attrib.developerMode) return DevModeSelector({ variant, setVariant, disabled })

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

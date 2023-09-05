import { Button } from '@ynput/ayon-react-components'

const VariantSelector = ({ variant, setVariant, disabled }) => {
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

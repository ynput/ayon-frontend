import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { SwitchButton, SwitchButtonProps } from '@ynput/ayon-react-components'
import { forwardRef } from 'react'

interface ShowProductsSwitchProps extends Omit<SwitchButtonProps, 'label' | 'value' | 'onClick'> {}

export const ShowProductsSwitch = forwardRef<HTMLButtonElement, ShowProductsSwitchProps>(
  ({ ...props }, ref) => {
    const { showProducts, onUpdateShowProducts } = useVPViewsContext()

    return (
      <SwitchButton
        {...props}
        label={'Show products'}
        ref={ref}
        value={showProducts}
        onClick={() => onUpdateShowProducts(!showProducts)}
        style={{ width: 'fit-content' }}
      />
    )
  },
)

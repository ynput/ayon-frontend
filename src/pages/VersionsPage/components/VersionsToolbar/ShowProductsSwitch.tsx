import { useVersionsViewsContext } from '@pages/VersionsPage/context/VersionsViewsContext'
import { SwitchButton, SwitchButtonProps } from '@ynput/ayon-react-components'
import { forwardRef } from 'react'

interface ShowProductsSwitchProps extends Omit<SwitchButtonProps, 'label' | 'value' | 'onClick'> {}

export const ShowProductsSwitch = forwardRef<HTMLButtonElement, ShowProductsSwitchProps>(
  ({ ...props }, ref) => {
    const { showProducts, onUpdateShowProducts } = useVersionsViewsContext()

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

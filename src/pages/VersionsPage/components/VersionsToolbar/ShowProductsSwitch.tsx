import { useVersionsDataContext } from '@pages/VersionsPage/context/VersionsDataContext'
import { SwitchButton, SwitchButtonProps } from '@ynput/ayon-react-components'
import { forwardRef, useMemo } from 'react'

interface ShowProductsSwitchProps extends Omit<SwitchButtonProps, 'label' | 'value' | 'onClick'> {}

export const ShowProductsSwitch = forwardRef<HTMLButtonElement, ShowProductsSwitchProps>(
  ({ ...props }, ref) => {
    const { showProducts, onUpdatedShowProducts } = useVersionsDataContext()

    return useMemo(
      () => (
        <SwitchButton
          {...props}
          label={'Show products'}
          ref={ref}
          value={showProducts}
          onClick={() => onUpdatedShowProducts(!showProducts)}
          style={{ width: 'fit-content' }}
        />
      ),
      [showProducts],
    )
  },
)

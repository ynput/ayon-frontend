import { useVersionsDataContext } from '@pages/VersionsPage/context/VersionsDataContext'
import { SwitchButton, SwitchButtonProps } from '@ynput/ayon-react-components'
import { forwardRef, useMemo } from 'react'

interface VersionsStackedSwitchProps
  extends Omit<SwitchButtonProps, 'label' | 'value' | 'onClick'> {}

export const VersionsStackedSwitch = forwardRef<HTMLButtonElement, VersionsStackedSwitchProps>(
  ({ ...props }, ref) => {
    const { showProducts, setShowProducts } = useVersionsDataContext()

    return useMemo(
      () => (
        <SwitchButton
          {...props}
          label={'Stacked'}
          ref={ref}
          value={showProducts}
          onClick={() => setShowProducts(!showProducts)}
          style={{ width: 'fit-content' }}
        />
      ),
      [showProducts],
    )
  },
)

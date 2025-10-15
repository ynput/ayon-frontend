import { useVersionsDataContext } from '@pages/VersionsPage/context/VersionsDataContext'
import { SwitchButton, SwitchButtonProps } from '@ynput/ayon-react-components'
import { forwardRef, useMemo } from 'react'

interface VersionsStackedSwitchProps
  extends Omit<SwitchButtonProps, 'label' | 'value' | 'onClick'> {}

export const VersionsStackedSwitch = forwardRef<HTMLButtonElement, VersionsStackedSwitchProps>(
  ({ ...props }, ref) => {
    const { isStacked, setIsStacked } = useVersionsDataContext()

    return useMemo(
      () => (
        <SwitchButton
          {...props}
          label={'Stacked'}
          ref={ref}
          value={isStacked}
          onClick={() => setIsStacked(!isStacked)}
          style={{ width: 'fit-content' }}
        />
      ),
      [isStacked],
    )
  },
)

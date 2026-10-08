import { PowerpackButton } from '@shared/components'
import type { FC } from 'react'
import type { ListValuesControlsProps } from './types'

// Without the powerpack the table shows entity values only; Compare offers the power feature
export const ListValuesUpsell: FC<ListValuesControlsProps> = () => (
  <PowerpackButton
    feature="listValues"
    icon="compare_arrows"
    label="Compare"
    bolt
    variant="surface"
    rounded={false}
  />
)

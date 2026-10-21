import { Button } from '@ynput/ayon-react-components'
import type { FC } from 'react'
import { toast } from 'react-toastify'
import { listValuesOutdatedMessage, type ListValuesOutdated } from './listValuesOutdated'

// Compare with an installed but outdated powerpack: says which version it needs, instead of the upsell
export const ListValuesOutdatedButton: FC<{ outdated: ListValuesOutdated }> = ({ outdated }) => {
  const message = listValuesOutdatedMessage(outdated)
  return (
    <Button
      icon="compare_arrows"
      label="Compare"
      variant="surface"
      onClick={() => toast.info(message)}
      data-tooltip={message}
      data-tooltip-delay={0}
    />
  )
}

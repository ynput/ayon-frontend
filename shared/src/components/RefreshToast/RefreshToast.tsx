import { Button } from '@ynput/ayon-react-components'

type RefreshToastProps = {
  message?: string
}

export const RefreshToast = ({ message = 'Refresh to see latest changes.' }: RefreshToastProps) => {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {message}
      <Button onClick={() => window.location.reload()} variant="filled">
        Refresh
      </Button>
    </div>
  )
}

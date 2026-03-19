import { Button } from '@ynput/ayon-react-components'

export const RefreshToast = () => {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      Refresh to see latest changes.
      <Button onClick={() => window.location.reload()} variant="filled">
        Refresh
      </Button>
    </div>
  )
}

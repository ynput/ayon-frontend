import { FC } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { copyToClipboard } from '@shared/util'
import { useFeedbackSafe } from '../Feedback'

export interface FilterErrorActionsProps {
  errorMessage?: string
}

export const FilterErrorActions: FC<FilterErrorActionsProps> = ({ errorMessage }) => {
  const feedback = useFeedbackSafe()

  if (!errorMessage) return null

  const handleReport = () =>
    feedback?.openSupport(
      'NewMessage',
      `I hit a filter error on ${window.location.pathname}\n\nError: ${errorMessage}`,
    )

  return (
    <>
      <Button
        variant="text"
        label="Copy error message"
        icon="content_copy"
        data-tooltip={errorMessage}
        onClick={() => copyToClipboard(errorMessage)}
      />
      {feedback?.messengerLoaded && (
        <Button variant="text" label="Report issue" icon="report" onClick={handleReport} />
      )}
    </>
  )
}

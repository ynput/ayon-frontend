// The host's dialog around a contribution's `dialog` piece (header and toolbar items, table
// shortcuts): AYON's Dialog with the title and size from the description, the piece inside.
import { useEffect } from 'react'
import { Dialog } from '@ynput/ayon-react-components'
import { ContributionView } from '@ynput/ayon-addon'
import type { AnyContribution, Contribution, SlotMap, SlotName } from '@ynput/ayon-addon'
import { reportContributionError } from '@ynput/ayon-addon/host'

// a crash inside the dialog closes it and shows a toast; the next click tries again (also the
// popover's and the services')
export const ReportCrash = ({
  contribution,
  error,
  onReported,
}: {
  contribution: AnyContribution
  error: Error
  onReported: () => void
}) => {
  useEffect(() => {
    reportContributionError(contribution, error)
    onReported()
  }, [contribution, error, onReported])
  return null
}

export interface AddonDialogProps<S extends SlotName> {
  contribution: Contribution<S>
  /** the slot's context with `close`; memoize it */
  context: SlotMap[S]['context'] & { close: () => void }
}

export const AddonDialog = <S extends SlotName>({ contribution, context }: AddonDialogProps<S>) => {
  const any = contribution as unknown as AnyContribution
  return (
    <Dialog
      isOpen
      header={String(any.dialogTitle || any.label || any.id)}
      size={(any.dialogSize as 'sm' | 'md' | 'lg' | 'full') || 'md'}
      onClose={context.close}
    >
      <ContributionView
        contribution={contribution}
        piece="dialog"
        context={context}
        error={(error) => (
          <ReportCrash contribution={any} error={error} onReported={context.close} />
        )}
      />
    </Dialog>
  )
}

// The host's dialog around a contribution's `dialog` piece (header and toolbar items, table
// shortcuts): AYON's Dialog with the title and size from the description, the piece inside.
import { useCallback, useEffect, useRef } from 'react'
import { ContributionView } from '@ynput/ayon-addon'
import type { AnyContribution, Contribution, SlotMap, SlotName } from '@ynput/ayon-addon'
import { reportContributionError } from '@ynput/ayon-addon/host'
import * as Styled from './AddonDialog.styled'

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
  /** the header's title; the description's `dialogTitle` or label when not set */
  title?: string
}

export const AddonDialog = <S extends SlotName>({
  contribution,
  context,
  title,
}: AddonDialogProps<S>) => {
  const any = contribution as unknown as AnyContribution
  const showHeader = any.dialogHeader !== false
  const dialogRef = useRef<HTMLDivElement>(null)
  // without the header's close button nothing takes focus, and Escape is handled on the dialog
  const focusDialog = useCallback(() => {
    if (!showHeader) dialogRef.current?.focus()
  }, [showHeader])
  return (
    <Styled.AddonDialog
      ref={dialogRef}
      isOpen
      header={showHeader ? title || String(any.dialogTitle || any.label || any.id) : undefined}
      hideCancelButton={!showHeader}
      classNames={showHeader ? undefined : { header: 'no-header' }}
      size={(any.dialogSize as 'sm' | 'md' | 'lg' | 'full') || 'md'}
      onClose={context.close}
      onShow={focusDialog}
    >
      <ContributionView
        contribution={contribution}
        piece="dialog"
        context={context}
        error={(error) => (
          <ReportCrash contribution={any} error={error} onReported={context.close} />
        )}
      />
    </Styled.AddonDialog>
  )
}

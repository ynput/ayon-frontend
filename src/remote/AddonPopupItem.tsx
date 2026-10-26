import { ContributionView, prefetchPiece } from '@ynput/ayon-addon'
import type { Contribution, PopupScope, SlotMap, SlotName } from '@ynput/ayon-addon'
import { reportContributionError } from '@ynput/ayon-addon/host'
import type { AnyContribution } from '@ynput/ayon-addon'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

// Slots whose component the host opens from a button it draws (header.item, ...)
type PopupSlot = {
  [S in SlotName]: SlotMap[S]['context'] extends PopupScope ? S : never
}[SlotName]

export interface PopupButtonProps {
  ref: (element: HTMLElement | null) => void
  active: boolean
  onClick: () => void
  onMouseEnter: () => void
}

interface AddonPopupItemProps<S extends PopupSlot> {
  contribution: Contribution<S>
  // the slot's context, without what this component adds (open, onClose, anchor)
  context: Omit<SlotMap[S]['context'], keyof PopupScope>
  renderButton: (props: PopupButtonProps) => ReactNode
}

// a crash is reported as a toast; the button stays and the next click tries again
const ReportCrash = ({
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

/**
 * The host's button for a contribution, and the contribution's component: loaded on the first
 * click (prefetched on hover), then kept mounted and told whether it is open.
 */
export const AddonPopupItem = <S extends PopupSlot>({
  contribution,
  context,
  renderButton,
}: AddonPopupItemProps<S>) => {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const onClose = useCallback(() => setOpen(false), [])
  const onCrash = useCallback(() => {
    setOpen(false)
    setMounted(false)
  }, [])
  const slotContext = useMemo(
    () => ({ ...context, open, onClose, anchor }) as SlotMap[S]['context'],
    [context, open, onClose, anchor],
  )
  const any = contribution as unknown as AnyContribution

  return (
    <>
      {renderButton({
        ref: setAnchor,
        active: open,
        onClick: () => {
          setMounted(true)
          setOpen((isOpen) => !isOpen)
        },
        onMouseEnter: () => prefetchPiece(any.component as never),
      })}
      {mounted && (
        <ContributionView
          contribution={contribution}
          context={slotContext}
          error={(error) => <ReportCrash contribution={any} error={error} onReported={onCrash} />}
        />
      )}
    </>
  )
}

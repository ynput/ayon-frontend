// Pieces of the stage used by both modes.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { ContributionView } from '@ynput/ayon-addon'
import type { AnyContribution } from '@ynput/ayon-addon'

type Context = Record<string, unknown>

export const Approximated = ({ what }: { what: string }) => (
  <span className="ayon-shell-approximated" title={`The shell's stand-in for AYON's ${what}`}>
    approximated
  </span>
)

/** A button that opens a popup contribution (header.item, projectTable.toolbarItem). */
export const PopupButton = ({
  contribution,
  context,
  autoOpen,
  onContext,
}: {
  contribution: AnyContribution
  context: Context
  autoOpen?: boolean
  onContext?: (context: Context) => void
}) => {
  const [open, setOpen] = useState(!!autoOpen)
  // like AYON: the component loads on the first click and stays mounted
  const [mounted, setMounted] = useState(!!autoOpen)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const onClose = useCallback(() => setOpen(false), [])
  const fields = contribution as { icon?: string; label?: string; tooltip?: string }
  const popupContext = useMemo(
    () => ({ ...context, open, onClose, anchor: anchorRef.current }),
    // anchorRef.current is set once the button rendered
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [context, open, onClose, mounted],
  )
  useEffect(() => onContext?.(popupContext), [onContext, popupContext])

  return (
    <>
      <Button
        ref={anchorRef}
        icon={fields.icon as never}
        label={fields.label && !fields.icon ? fields.label : undefined}
        data-tooltip={fields.tooltip || fields.label}
        variant="text"
        selected={open}
        data-contribution-button={contribution.key}
        onClick={() => {
          setMounted(true)
          setOpen((current) => !current)
        }}
      />
      {mounted && <ContributionView contribution={contribution as never} context={popupContext as never} />}
    </>
  )
}


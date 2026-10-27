// Pieces of the stage used by both modes.
import { Button } from '@ynput/ayon-react-components'
import type { AnyContribution } from '@ynput/ayon-addon'
import { AddonButton } from '@ynput/ayon-frontend-shared/components'

type Context = Record<string, unknown>

export const Approximated = ({ what }: { what: string }) => (
  <span className="ayon-shell-approximated" title={`The shell's stand-in for AYON's ${what}`}>
    approximated
  </span>
)

/**
 * A header or toolbar item (header.item, projectTable.toolbarItem): AYON's AddonButton, which does
 * what the item asks on click, with the shell's plain button.
 */
export const ButtonItem = ({
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
  const fields = contribution as { icon?: string; label?: string; tooltip?: string }
  return (
    <AddonButton
      contribution={contribution as never}
      context={context as never}
      autoOpen={autoOpen}
      onContext={onContext as ((context: object) => void) | undefined}
      renderButton={({ ref, active, onClick, onMouseEnter }) => (
        <Button
          ref={ref}
          icon={fields.icon as never}
          label={fields.label && !fields.icon ? fields.label : undefined}
          data-tooltip={fields.tooltip || fields.label}
          variant="text"
          selected={active}
          data-contribution-button={contribution.key}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
        />
      )}
    />
  )
}

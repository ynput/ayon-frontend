// Pieces of the stage used by both modes.
import { Button } from '@ynput/ayon-react-components'
import type { AnyContribution } from '@ynput/ayon-addon'
import { AddonButton } from '@ynput/ayon-frontend-shared/components'

type Context = Record<string, unknown>

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

/** What the stage shows for an app.service: it has no UI, and runs once for the whole shell. */
export const ServiceNote = () => (
  <div style={{ padding: 16, color: 'var(--md-sys-color-outline)' }} data-shell-surface="service">
    A service has no UI. It is mounted once for the whole shell, as in AYON, and keeps running while
    you pick other contributions; a crash shows as a toast. Its context is the shell&apos;s project.
  </div>
)

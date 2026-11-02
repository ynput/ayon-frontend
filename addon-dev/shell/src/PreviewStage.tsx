// Preview: the contribution with the fixture's context, every request answered from the fixture.
// Components render in a frame the size of their place in AYON; menu items are a menu to run.
import { useCallback, useEffect, useMemo } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { ContributionView, runContribution } from '@ynput/ayon-addon'
import type { AnyContribution } from '@ynput/ayon-addon'
import { getFixture } from './network'
import { ShellTable } from './ShellTable'
import { isMenuSlot } from './slotNeeds'
import { setStage } from './status'
import type { ShellSelection } from './types'
import { ButtonItem, ServiceNote } from './parts'

const FRAME_WIDTH: Partial<Record<string, number>> = {
  'detailsPanel.tab': 620,
  'projectTable.customizeSection': 320,
}

export const PreviewStage = ({
  contribution,
  selection,
}: {
  contribution: AnyContribution
  selection: ShellSelection
}) => {
  const fixture = getFixture()
  const context = useMemo(() => fixture?.context || {}, [fixture])
  const slot = contribution.slot
  const run = useCallback(
    () => runContribution(contribution as never, context as never),
    [contribution, context],
  )
  const onPopupContext = useCallback(
    (popup: Record<string, unknown>) => setStage({ context: popup, ready: true }),
    [],
  )
  const isPopup = slot === 'header.item' || slot === 'projectTable.toolbarItem'
  // a table shortcut with a dialog: its content, as for a page
  const isDialog = slot === 'table.shortcut' && !!(contribution as { dialog?: unknown }).dialog
  const runs = isMenuSlot(slot) && !isDialog

  useEffect(() => {
    if (!fixture) return
    if (!isPopup) setStage({ context, ready: true, run: runs ? run : undefined })
  }, [fixture, context, run, isPopup, runs])

  if (!fixture) {
    return (
      <div role="alert" className="ayon-addon-error">
        No fixture dev/fixtures/{selection.preview}.json
      </div>
    )
  }
  if (fixture.slot !== slot || fixture.id !== (contribution as { id: string }).id) {
    return (
      <div role="alert" className="ayon-addon-error">
        The fixture is for {fixture.slot} {fixture.id}.
      </div>
    )
  }

  const frame = (() => {
    if (isPopup) {
      return (
        <div className="ayon-shell-bar">
          <span className="spacer" />
          <ButtonItem contribution={contribution} context={context} autoOpen onContext={onPopupContext} />
        </div>
      )
    }
    if (isDialog) {
      return (
        <div className="ayon-shell-body" data-shell-surface="preview-frame">
          <ContributionView
            contribution={contribution as never}
            piece="dialog"
            context={{ ...context, close: () => undefined } as never}
          />
        </div>
      )
    }
    if (runs) {
      const item = contribution as { label?: string; icon?: string }
      return (
        <div style={{ padding: 16 }}>
          <Button icon={item.icon as never} label={item.label} data-shell-action="run" onClick={run} />
        </div>
      )
    }
    // mounted once by the shell (Shell.tsx), not here
    if (slot === 'app.service') return <ServiceNote />
    if (slot === 'tableColumn') {
      const entities = (context.entities || []) as never[]
      return (
        <ShellTable
          page={(context.page as never) || 'overview'}
          entities={entities}
          selected={[]}
          onSelect={() => undefined}
        />
      )
    }
    return (
      <div
        className="ayon-shell-body"
        style={{ width: FRAME_WIDTH[slot] ?? '100%', flex: FRAME_WIDTH[slot] ? '0 0 auto' : 1 }}
        data-shell-surface="preview-frame"
      >
        <ContributionView contribution={contribution as never} context={context as never} />
      </div>
    )
  })()

  return frame
}

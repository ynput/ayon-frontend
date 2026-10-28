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
import { Approximated, PopupButton } from './parts'

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

  useEffect(() => {
    if (!fixture) return
    if (!isPopup) setStage({ context, ready: true, run: isMenuSlot(slot) ? run : undefined })
  }, [fixture, context, slot, run, isPopup])

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
          <PopupButton contribution={contribution} context={context} autoOpen onContext={onPopupContext} />
        </div>
      )
    }
    if (isMenuSlot(slot)) {
      const item = contribution as { label?: string; icon?: string }
      return (
        <div style={{ padding: 16 }}>
          <Button icon={item.icon as never} label={item.label} data-shell-action="run" onClick={run} />
        </div>
      )
    }
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

  return (
    <>
      <div className="ayon-shell-bar">
        <span>
          {slot} {(contribution as { id: string }).id}
        </span>
        <Approximated what={`place of ${slot}`} />
      </div>
      {frame}
    </>
  )
}

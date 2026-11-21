import { FC, MouseEvent } from 'react'
import { format, isThisYear } from 'date-fns'
import { Button, Icon } from '@ynput/ayon-react-components'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { beforeSave, DATE_FORMAT, getFieldId, getPathTitles } from './settingsHistoryHelpers'
import type { AddonComparison, SettingsComparison } from './useSettingsHistory'
import type { useComparisonActions } from './useComparisonActions'
import { describeNote, SettingName, SplitDiff } from './SettingsDiff'
import * as Styled from './SettingsComparisonPanel.styled'

const describeStatus = (addon: AddonComparison) => {
  if (addon.status === 'loading') return 'Loading…'
  if (addon.status === 'error') return 'Could not load the settings of that time'
  if (!addon.diffs.length) return 'No differences'
  return null
}

type Props = {
  comparison: SettingsComparison
  schemas: Record<string, any>
  actions: ReturnType<typeof useComparisonActions>
  onFocus: (addonName: string, path: string[], fieldId: string) => void
  onClose: () => void
}

/** What differs between the settings at the compared time and the saved settings now */
export const SettingsComparisonPanel: FC<Props> = ({
  comparison,
  schemas,
  actions,
  onFocus,
  onClose,
}) => {
  const [openMenu] = useCreateContextMenu([])
  const total = comparison.addons.reduce((acc, addon) => acc + addon.diffs.length, 0)
  const saves = comparison.addons.reduce((acc, addon) => acc + addon.changesSince.length, 0)
  const isLoading = comparison.addons.some((addon) => addon.status === 'loading')
  // picked from a save: the settings are those from just before it
  const fromSave = comparison.addons.some(({ lane }) =>
    lane.changes.some((change) => beforeSave(change) === comparison.at),
  )

  const openMoreMenu = (e: MouseEvent) =>
    openMenu(e, [
      {
        label: `Revert all to ${format(comparison.at, DATE_FORMAT)}`,
        icon: 'history',
        command: actions.revertAll,
        disabled: isLoading || !total,
      },
    ])

  return (
    <Styled.Panel>
      <Styled.Header>
        <Icon icon="history" />
        <span className="label">
          {fromSave && 'Before '}
          {format(comparison.at, isThisYear(comparison.at) ? 'd MMM, HH:mm' : DATE_FORMAT)} → now
          <small>
            {isLoading
              ? 'Loading…'
              : !total
              ? 'No settings differ from now'
              : `${total} setting${total === 1 ? '' : 's'} changed since, in ${saves} save${
                  saves === 1 ? '' : 's'
                }`}
          </small>
        </span>
        <Button
          variant="text"
          icon="more_vert"
          onClick={openMoreMenu}
          data-tooltip="More actions"
        />
        <Button variant="text" icon="close" onClick={onClose} data-tooltip="Stop comparing" />
      </Styled.Header>
      <Styled.List>
        {comparison.addons.map((addon) => {
          const { lane } = addon
          const schema = schemas[lane.addonName]
          const status = describeStatus(addon)
          return (
            <div key={lane.addonName}>
              <Styled.AddonHeader>
                <span className="swatch" style={{ backgroundColor: lane.color }} />
                {lane.title}
                <span className="versions">
                  {addon.thenVersion && addon.thenVersion !== lane.currentVersion
                    ? `${addon.thenVersion} → ${lane.currentVersion}`
                    : lane.currentVersion}
                </span>
              </Styled.AddonHeader>
              {status && <Styled.Status>{status}</Styled.Status>}
              {addon.diffs.map((diff) => {
                const titles = getPathTitles(schema, diff.path)
                const note = describeNote(diff)
                return (
                  <Styled.Row
                    key={diff.path.join('/')}
                    onClick={() => onFocus(lane.addonName, diff.path, getFieldId(diff.path))}
                    onContextMenu={(e) =>
                      openMenu(e, actions.getMenuItems(lane.addonName, diff, true))
                    }
                    data-tooltip={`${titles.join(
                      ' › ',
                    )}\nClick to show it in the editor, right-click for more`}
                    data-tooltip-delay={500}
                  >
                    <span className="head">
                      <SettingName titles={titles.slice(-2)} />
                      {note && <span className="note">{note}</span>}
                    </span>
                    <SplitDiff diff={diff} />
                    {actions.isStaged(lane.addonName, diff.path) && (
                      <Icon
                        icon="history"
                        className="staged"
                        data-tooltip="Reverted, not saved yet"
                      />
                    )}
                  </Styled.Row>
                )
              })}
            </div>
          )
        })}
      </Styled.List>
    </Styled.Panel>
  )
}

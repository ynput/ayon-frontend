import { FC, MouseEvent } from 'react'
import { format } from 'date-fns'
import { Button, Icon } from '@ynput/ayon-react-components'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { getFieldId, getPathTitles, groupByParent } from './settingsHistoryHelpers'
import type { AddonComparison, SettingsComparison } from './useSettingsHistory'
import type { useComparisonActions } from './useComparisonActions'
import { DiffValues } from './SettingsDiff'
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
  const isLoading = comparison.addons.some((addon) => addon.status === 'loading')

  const openMoreMenu = (e: MouseEvent) =>
    openMenu(e, [
      {
        label: `Revert all to ${format(comparison.at, 'd MMM, HH:mm')}`,
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
          Changed since {format(comparison.at, 'EEE d MMM, HH:mm')}
          <small>
            {isLoading
              ? 'Loading…'
              : total === 1
              ? '1 setting differs'
              : `${total || 'No'} settings differ`}
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
              {groupByParent(addon.diffs).map(({ parent, diffs }) => (
                <div key={parent.join('/')}>
                  {!!parent.length && (
                    <Styled.Parent>{getPathTitles(schema, parent).join(' › ')}</Styled.Parent>
                  )}
                  {diffs.map((diff) => {
                    const title = getPathTitles(schema, diff.path).pop()
                    const staged = actions.isStaged(lane.addonName, diff.path)
                    return (
                      <Styled.Row
                        key={diff.path.join('/')}
                        onClick={() => onFocus(lane.addonName, diff.path, getFieldId(diff.path))}
                        onContextMenu={(e) =>
                          openMenu(e, actions.getMenuItems(lane.addonName, diff, true))
                        }
                        title="Show in the editor, right-click to revert"
                      >
                        <span className="name">{title}</span>
                        <DiffValues diff={diff} />
                        {staged && (
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
              ))}
            </div>
          )
        })}
      </Styled.List>
    </Styled.Panel>
  )
}

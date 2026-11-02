import { FC, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { endOfDay, format, startOfDay } from 'date-fns'
import { Button, Dropdown, Icon, InputSwitch, InputText } from '@ynput/ayon-react-components'
import { DateRangePicker } from '@shared/components/DateRangePicker'
import { useListProjectsQuery, useGetUsersQuery } from '@shared/api'
import type { EventFilters, EventItem, Severity } from '../../types'
import { getCategoryMeta, SEVERITIES, STATUSES } from '../../utils/eventMeta'
import { ROLLING_DATE_PRESETS } from '../../utils/datePresets'
import { countActiveFilters } from '../../hooks/useEventsViewState'
import { useEventFacets } from '../../hooks/useEventFacets'
import { TopicInput } from './TopicInput'
import * as Styled from './EventsFilters.styled'

// the date picker works with utc midnights, the filters with local day boundaries
const pickerToLocal = (iso: string) => {
  const d = new Date(iso)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}
const localToPicker = (iso?: string) => {
  if (!iso) return null
  const d = new Date(iso)
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
}

const toggle = <T,>(list: T[] | undefined, value: T) =>
  list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value]

export interface EventsFiltersProps {
  filters: EventFilters
  onChange: (patch: Partial<EventFilters>) => void
  onClear: () => void
  /** loaded events, used for counts and suggestions */
  events: EventItem[]
  entityLabel?: string
}

export const EventsFilters: FC<EventsFiltersProps> = ({
  filters,
  onChange,
  onClear,
  events,
  entityLabel,
}) => {
  const isAdmin = useSelector((state: any) => state.user.data.isAdmin)
  const [entityDraft, setEntityDraft] = useState('')

  const { data: projects = [] } = useListProjectsQuery({})
  const { data: users = [] } = useGetUsersQuery({}) as { data?: { name: string }[] }

  const { counts, categories } = useEventFacets(events, filters.types)

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.name, label: p.name })),
    [projects],
  )
  const userOptions = useMemo(() => users.map((u) => ({ value: u.name, label: u.name })), [users])

  const addTopic = (topic: string) => {
    if (!filters.topics?.includes(topic)) onChange({ topics: [...(filters.topics ?? []), topic] })
  }

  const applyEntityDraft = () => {
    const id = entityDraft.trim().replace(/-/g, '')
    if (id) onChange({ entity: id })
    setEntityDraft('')
  }

  const activeCount = countActiveFilters(filters)

  return (
    <Styled.Panel aria-label="Event filters">
      <Styled.PanelHeader>
        <h2>Filters</h2>
        {activeCount > 0 && (
          <Button
            variant="text"
            icon="filter_alt_off"
            label={`Clear (${activeCount})`}
            onClick={onClear}
          />
        )}
      </Styled.PanelHeader>

      <Styled.Group>
        <Styled.GroupTitle>Date range</Styled.GroupTitle>
        <Styled.Segmented role="group" aria-label="Quick date range">
          {ROLLING_DATE_PRESETS.map((preset) => {
            const active = filters.datePreset === preset.id
            return (
              <button
                key={preset.id}
                aria-pressed={active}
                aria-label={preset.label}
                className={active ? 'active' : ''}
                onClick={() =>
                  onChange({
                    datePreset: active ? undefined : preset.id,
                    newerThan: undefined,
                    olderThan: undefined,
                  })
                }
              >
                {preset.short}
              </button>
            )
          })}
        </Styled.Segmented>
        <Styled.DateRow>
          <DateRangePicker
            value={{
              startDate: localToPicker(filters.newerThan),
              endDate: localToPicker(filters.olderThan),
            }}
            onChange={({ startDate, endDate }) =>
              onChange({
                datePreset: undefined,
                newerThan: startDate
                  ? startOfDay(pickerToLocal(startDate)).toISOString()
                  : undefined,
                olderThan: endDate ? endOfDay(pickerToLocal(endDate)).toISOString() : undefined,
              })
            }
            maxDate={new Date()}
            emptyTrigger={
              <Styled.DateTrigger>
                <Icon icon="date_range" /> Custom range
              </Styled.DateTrigger>
            }
            valueTrigger={() => (
              <Styled.DateTrigger className="active">
                <Icon icon="date_range" />
                {filters.newerThan
                  ? format(new Date(filters.newerThan), 'd MMM HH:mm')
                  : '…'} –{' '}
                {filters.olderThan ? format(new Date(filters.olderThan), 'd MMM') : 'now'}
              </Styled.DateTrigger>
            )}
          />
        </Styled.DateRow>
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Severity</Styled.GroupTitle>
        <Styled.ChipRow role="group" aria-label="Severity">
          {SEVERITIES.map((s) => {
            const active = !!filters.severities?.includes(s.value)
            return (
              <Styled.ToggleChip
                key={s.value}
                aria-pressed={active}
                className={active ? 'active' : ''}
                onClick={() =>
                  onChange({ severities: toggle<Severity>(filters.severities, s.value) })
                }
              >
                <Icon icon={s.icon} style={{ color: active ? undefined : s.color }} />
                {s.label}
              </Styled.ToggleChip>
            )
          })}
        </Styled.ChipRow>
        <Styled.Hint>Matches log messages of that level</Styled.Hint>
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Type</Styled.GroupTitle>
        <Styled.CheckList>
          {categories.map((category) => {
            const meta = getCategoryMeta(category)
            const count = counts.byCategory.get(category)
            return (
              <li key={category}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!filters.types?.includes(category)}
                    onChange={() => onChange({ types: toggle(filters.types, category) })}
                  />
                  <Icon icon={meta.icon} style={{ color: meta.color }} />
                  <span className="label">{meta.label}</span>
                  {count !== undefined && <span className="count">{count}</span>}
                </label>
              </li>
            )
          })}
        </Styled.CheckList>
        <Styled.Toggle>
          <span>Include logs when no type is selected</span>
          <InputSwitch
            checked={!filters.hideLogs}
            onChange={() => onChange({ hideLogs: !filters.hideLogs })}
            aria-label="Include logs"
          />
        </Styled.Toggle>
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Topic</Styled.GroupTitle>
        <TopicInput topicCounts={counts.byTopic} selected={filters.topics ?? []} onAdd={addTopic} />
        <Styled.Hint>Pick a suggestion or type a topic, use * as a wildcard</Styled.Hint>
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Status</Styled.GroupTitle>
        <Styled.CheckList>
          {STATUSES.map((status) => (
            <li key={status.value}>
              <label>
                <input
                  type="checkbox"
                  checked={!!filters.statuses?.includes(status.value)}
                  onChange={() => onChange({ statuses: toggle(filters.statuses, status.value) })}
                />
                <Icon icon={status.icon} />
                <span className="label">{status.label}</span>
                {counts.byStatus.has(status.value) && (
                  <span className="count">{counts.byStatus.get(status.value)}</span>
                )}
              </label>
            </li>
          ))}
        </Styled.CheckList>
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Project</Styled.GroupTitle>
        <Dropdown
          options={projectOptions}
          value={filters.projects ?? []}
          onChange={(value) => onChange({ projects: value })}
          multiSelect
          search
          dataKey="value"
          labelKey="label"
          placeholder="Any project"
          onClear={() => onChange({ projects: [] })}
          widthExpand
        />
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>User</Styled.GroupTitle>
        <Dropdown
          options={userOptions}
          value={filters.users ?? []}
          onChange={(value) => onChange({ users: value })}
          multiSelect
          search
          dataKey="value"
          labelKey="label"
          placeholder="Any user"
          onClear={() => onChange({ users: [] })}
          widthExpand
        />
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Entity</Styled.GroupTitle>
        {filters.entity ? (
          <Styled.ToggleChip
            className="active"
            onClick={() => onChange({ entity: undefined })}
            aria-label="Remove entity filter"
            title={filters.entity}
          >
            <Icon icon="deployed_code" />
            <span className="ellipsis">{entityLabel || filters.entity}</span>
            <Icon icon="close" />
          </Styled.ToggleChip>
        ) : isAdmin ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              applyEntityDraft()
            }}
          >
            <InputText
              value={entityDraft}
              onChange={(e) => setEntityDraft(e.target.value)}
              onBlur={applyEntityDraft}
              placeholder="Entity id"
              aria-label="Filter by entity id"
              autoComplete="off"
              style={{ width: '100%' }}
            />
          </form>
        ) : null}
        <Styled.Hint>
          {isAdmin
            ? 'Paste an entity id, or open an event and choose "Entity timeline"'
            : 'Filtering by entity requires admin access'}
        </Styled.Hint>
      </Styled.Group>
    </Styled.Panel>
  )
}

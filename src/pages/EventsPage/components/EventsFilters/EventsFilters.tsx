import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import clsx from 'clsx'
import { endOfDay, format, parse, startOfDay } from 'date-fns'
import {
  AssigneeSelect,
  Button,
  DateField,
  DefaultItemTemplate,
  DefaultValueTemplate,
  Dropdown,
  Icon,
  InputSwitch,
  InputText,
  UserImagesStacked,
} from '@ynput/ayon-react-components'
import { useListProjectsQuery, useGetUsersQuery } from '@shared/api'
import type { EventFilters, EventItem, Severity } from '../../types'
import { getCategoryMeta, SEVERITIES, STATUSES } from '../../utils/eventMeta'
import { ROLLING_DATE_PRESETS } from '../../utils/datePresets'
import { countActiveFilters } from '../../hooks/useEventsViewState'
import { useEventFacets } from '../../hooks/useEventFacets'
import * as Styled from './EventsFilters.styled'

const DATE_FORMAT = 'yyyy-MM-dd'
// the filters hold local day boundaries as ISO strings, the date fields work with YYYY-MM-DD
const toDateValue = (iso?: string) => (iso ? format(new Date(iso), DATE_FORMAT) : '')
const fromDateValue = (value: string) => parse(value, DATE_FORMAT, new Date())

const toggle = <T,>(list: T[] | undefined, value: T) =>
  list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value]

const FilterOption: FC<{
  icon: string
  iconColor?: string
  label: string
  selected: boolean
  onClick: () => void
}> = ({ icon, iconColor, label, selected, onClick }) => (
  <li>
    <Styled.Option aria-pressed={selected} className={clsx({ selected })} onClick={onClick}>
      <Icon icon={icon as any} style={{ color: iconColor }} />
      <span className="label">{label}</span>
      <Icon icon="check" className="check" />
    </Styled.Option>
  </li>
)

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
  const { data: users = [] } = useGetUsersQuery({}) as {
    data?: { name: string; fullName?: string; avatarUrl?: string }[]
  }

  const { categories, topics } = useEventFacets(events, filters.types)

  // the date fields hold a draft and only apply it on Enter or blur, so typing doesn't refetch
  const [startDraft, setStartDraft] = useState(() => toDateValue(filters.newerThan))
  const [endDraft, setEndDraft] = useState(() => toDateValue(filters.olderThan))
  // presets and clear change the filters from outside, so the drafts follow them
  useEffect(() => {
    setStartDraft(toDateValue(filters.newerThan))
  }, [filters.newerThan])
  useEffect(() => {
    setEndDraft(toDateValue(filters.olderThan))
  }, [filters.olderThan])
  const startInputRef = useRef<HTMLInputElement>(null)
  const endInputRef = useRef<HTMLInputElement>(null)
  const todayValue = format(new Date(), DATE_FORMAT)

  const commitStart = (value: string) => {
    onChange({
      datePreset: undefined,
      newerThan: value ? startOfDay(fromDateValue(value)).toISOString() : undefined,
    })
    // Enter moves on to the end date. Leaving the field with the mouse must not steal focus.
    // Only focus, not the native picker: an open picker takes the typed keys and Enter
    if (value && document.activeElement === startInputRef.current) endInputRef.current?.focus()
  }

  const commitEnd = (value: string) => {
    onChange({
      datePreset: undefined,
      olderThan: value ? endOfDay(fromDateValue(value)).toISOString() : undefined,
    })
  }

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.name, label: p.name })),
    [projects],
  )

  const applyEntityDraft = () => {
    const id = entityDraft.trim().replace(/-/g, '')
    if (id) onChange({ entity: id })
    setEntityDraft('')
  }

  const clearUsers = filters.users?.length ? () => onChange({ users: [] }) : undefined

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
        <Styled.Presets role="group" aria-label="Quick date range">
          {ROLLING_DATE_PRESETS.map((preset) => {
            const active = filters.datePreset === preset.id
            return (
              <Button
                key={preset.id}
                variant="text"
                selected={active}
                aria-pressed={active}
                aria-label={preset.label}
                label={preset.short}
                onClick={() =>
                  onChange({
                    datePreset: active ? undefined : preset.id,
                    newerThan: undefined,
                    olderThan: undefined,
                  })
                }
              />
            )
          })}
        </Styled.Presets>
        <Styled.DateFields>
          <Styled.GroupTitle>Start date</Styled.GroupTitle>
          <Styled.GroupTitle>End date</Styled.GroupTitle>
          <DateField
            ref={startInputRef}
            aria-label="Start date"
            value={startDraft}
            onChange={setStartDraft}
            onCommit={commitStart}
            max={endDraft || todayValue}
          />

          <DateField
            ref={endInputRef}
            aria-label="End date"
            value={endDraft}
            onChange={setEndDraft}
            onCommit={commitEnd}
            min={startDraft || undefined}
            max={todayValue}
          />
        </Styled.DateFields>
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Severity</Styled.GroupTitle>
        <Styled.Options aria-label="Severity">
          {SEVERITIES.map((s) => (
            <FilterOption
              key={s.value}
              icon={s.icon}
              iconColor={s.color}
              label={s.label}
              selected={!!filters.severities?.includes(s.value)}
              onClick={() =>
                onChange({ severities: toggle<Severity>(filters.severities, s.value) })
              }
            />
          ))}
        </Styled.Options>
        <Styled.Hint>Matches log messages of that level</Styled.Hint>
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Type</Styled.GroupTitle>
        <Styled.Options aria-label="Type">
          {categories.map((category) => {
            const meta = getCategoryMeta(category)
            return (
              <FilterOption
                key={category}
                icon={meta.icon}
                iconColor={meta.color}
                label={meta.label}
                selected={!!filters.types?.includes(category)}
                onClick={() => onChange({ types: toggle(filters.types, category) })}
              />
            )
          })}
        </Styled.Options>
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
        <Dropdown
          options={topics}
          value={filters.topics ?? []}
          onChange={(value) => onChange({ topics: value })}
          multiSelect
          editable
          dataKey="value"
          labelKey="label"
          placeholder="Any topic"
          onClear={filters.topics?.length ? () => onChange({ topics: [] }) : undefined}
          widthExpand
          itemTemplate={(option, _isActive, isSelected) => (
            <DefaultItemTemplate
              option={option}
              dataKey="value"
              labelKey="label"
              selected={isSelected ? [option.value] : []}
              value={filters.topics ?? []}
              multiSelect
            />
          )}
        />
        <Styled.Hint>Pick a suggestion or type a topic, use * as a wildcard</Styled.Hint>
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Status</Styled.GroupTitle>
        <Styled.Options aria-label="Status">
          {STATUSES.map((status) => (
            <FilterOption
              key={status.value}
              icon={status.icon}
              label={status.label}
              selected={!!filters.statuses?.includes(status.value)}
              onClick={() => onChange({ statuses: toggle(filters.statuses, status.value) })}
            />
          ))}
        </Styled.Options>
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
          onClear={filters.projects?.length ? () => onChange({ projects: [] }) : undefined}
          widthExpand
        />
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>User</Styled.GroupTitle>
        <AssigneeSelect
          options={users}
          value={filters.users ?? []}
          onChange={(value) => onChange({ users: value })}
          sortBySelected={false}
          multiSelectClose={false}
          onClear={clearUsers}
          widthExpand
          // the same field as the other filter dropdowns, the default one has no border or arrow
          valueTemplate={(value, _selected, isOpen) => (
            <DefaultValueTemplate
              value={value}
              isOpen={isOpen}
              placeholder="Any user"
              onClear={clearUsers}
            >
              <Styled.UserValue>
                <UserImagesStacked
                  users={users.filter((u) => value.includes(u.name))}
                  size={20}
                  gap={-0.4}
                />
                <span>{value.join(', ')}</span>
              </Styled.UserValue>
            </DefaultValueTemplate>
          )}
        />
      </Styled.Group>

      <Styled.Group>
        <Styled.GroupTitle>Entity</Styled.GroupTitle>
        {filters.entity ? (
          <Styled.EntityButton
            variant="surface"
            icon="close"
            label={entityLabel || filters.entity}
            onClick={() => onChange({ entity: undefined })}
            aria-label="Remove entity filter"
            data-tooltip="Remove entity filter"
          />
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

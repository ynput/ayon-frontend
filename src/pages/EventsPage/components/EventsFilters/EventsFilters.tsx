import { FC, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import clsx from 'clsx'
import { endOfDay, startOfDay } from 'date-fns'
import {
  AssigneeSelect,
  Button,
  DefaultItemTemplate,
  DefaultValueTemplate,
  Dropdown,
  Icon,
  InputDate,
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

const END_DATE_INPUT_ID = 'events-filter-end-date'
// the panel scrolls, a calendar rendered inside it would be clipped
const DATE_PORTAL_ID = 'events-filter-date-portal'

// the ARC props don't line up with the installed datepicker types, CustomDateRangeDialog casts too
const DateInput = InputDate as FC<any>

const toDate = (iso?: string) => (iso ? new Date(iso) : null)

const toggle = <T,>(list: T[] | undefined, value: T) =>
  list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value]

const FilterOption: FC<{
  icon: string
  iconColor?: string
  label: string
  count?: number
  selected: boolean
  onClick: () => void
}> = ({ icon, iconColor, label, count, selected, onClick }) => (
  <li>
    <Styled.Option aria-pressed={selected} className={clsx({ selected })} onClick={onClick}>
      <Icon icon={icon as any} style={{ color: iconColor }} />
      <span className="label">{label}</span>
      {count !== undefined && <span className="count">{count}</span>}
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

  const { counts, categories, topics } = useEventFacets(events, filters.types)

  // the date picker reports every parsed keystroke, so wait for it to close before moving on
  const startDateChanged = useRef(false)
  const handleStartDateClose = () => {
    if (!startDateChanged.current) return
    startDateChanged.current = false
    // the picker returns focus to its own input right after closing, go after that
    setTimeout(() => document.getElementById(END_DATE_INPUT_ID)?.focus(), 50)
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
          <DateInput
            selected={toDate(filters.newerThan)}
            onChange={(date: Date | null) => {
              startDateChanged.current = true
              onChange({
                datePreset: undefined,
                newerThan: date ? startOfDay(date).toISOString() : undefined,
              })
            }}
            onCalendarClose={handleStartDateClose}
            selectsStart
            startDate={toDate(filters.newerThan)}
            endDate={toDate(filters.olderThan)}
            maxDate={toDate(filters.olderThan) ?? new Date()}
            placeholderText="Start date"
            portalId={DATE_PORTAL_ID}
          />
          <DateInput
            id={END_DATE_INPUT_ID}
            selected={toDate(filters.olderThan)}
            onChange={(date: Date | null) =>
              onChange({
                datePreset: undefined,
                olderThan: date ? endOfDay(date).toISOString() : undefined,
              })
            }
            selectsEnd
            startDate={toDate(filters.newerThan)}
            endDate={toDate(filters.olderThan)}
            minDate={toDate(filters.newerThan)}
            maxDate={new Date()}
            placeholderText="End date"
            portalId={DATE_PORTAL_ID}
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
                count={counts.byCategory.get(category) ?? 0}
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
              endContent={
                !isSelected &&
                option.count !== undefined && <Styled.TopicCount>{option.count}</Styled.TopicCount>
              }
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
              count={counts.byStatus.get(status.value) ?? 0}
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

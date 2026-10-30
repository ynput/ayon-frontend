import { FC } from 'react'
import styled from 'styled-components'
import { format } from 'date-fns'
import { Icon, theme } from '@ynput/ayon-react-components'
import type { EventFilters } from '../types'
import { getCategoryMeta, getStatusMeta, SEVERITIES } from '../utils/eventMeta'

const Chips = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
`

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 260px;
  height: 26px;
  padding: 0 4px 0 8px;
  border: none;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  cursor: pointer;
  ${theme.labelMedium}

  .key {
    opacity: 0.75;
  }
  .value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .icon {
    font-size: 16px;
  }

  &:hover {
    background-color: var(--md-sys-color-secondary-container-hover);
  }
  &:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
  }
`

type ChipItem = { id: string; label: string; value: string; patch: Partial<EventFilters> }

const without = <T,>(list: T[] | undefined, value: T) => list?.filter((v) => v !== value)

const formatDate = (iso: string) => format(new Date(iso), 'd MMM HH:mm')

export const getFilterChips = (filters: EventFilters, entityLabel?: string): ChipItem[] => {
  const chips: ChipItem[] = []
  if (filters.search)
    chips.push({
      id: 'search',
      label: 'Search',
      value: filters.search,
      patch: { search: undefined },
    })
  if (filters.entity)
    chips.push({
      id: 'entity',
      label: 'Entity',
      value: entityLabel || filters.entity,
      patch: { entity: undefined },
    })
  filters.types?.forEach((t) =>
    chips.push({
      id: `type-${t}`,
      label: 'Type',
      value: getCategoryMeta(t).label,
      patch: { types: without(filters.types, t) },
    }),
  )
  filters.topics?.forEach((t) =>
    chips.push({
      id: `topic-${t}`,
      label: 'Topic',
      value: t,
      patch: { topics: without(filters.topics, t) },
    }),
  )
  filters.severities?.forEach((s) =>
    chips.push({
      id: `severity-${s}`,
      label: 'Severity',
      value: SEVERITIES.find((x) => x.value === s)?.label ?? s,
      patch: { severities: without(filters.severities, s) },
    }),
  )
  filters.statuses?.forEach((s) =>
    chips.push({
      id: `status-${s}`,
      label: 'Status',
      value: getStatusMeta(s).label,
      patch: { statuses: without(filters.statuses, s) },
    }),
  )
  filters.projects?.forEach((p) =>
    chips.push({
      id: `project-${p}`,
      label: 'Project',
      value: p,
      patch: { projects: without(filters.projects, p) },
    }),
  )
  filters.users?.forEach((u) =>
    chips.push({
      id: `user-${u}`,
      label: 'User',
      value: u,
      patch: { users: without(filters.users, u) },
    }),
  )
  if (filters.newerThan || filters.olderThan)
    chips.push({
      id: 'date',
      label: 'Date',
      value: `${filters.newerThan ? formatDate(filters.newerThan) : '…'} – ${
        filters.olderThan ? formatDate(filters.olderThan) : 'now'
      }`,
      patch: { newerThan: undefined, olderThan: undefined },
    })
  if (filters.hideLogs)
    chips.push({ id: 'logs', label: 'Logs', value: 'hidden', patch: { hideLogs: undefined } })
  return chips
}

export const ActiveFilters: FC<{
  filters: EventFilters
  entityLabel?: string
  onChange: (patch: Partial<EventFilters>) => void
}> = ({ filters, entityLabel, onChange }) => {
  const chips = getFilterChips(filters, entityLabel)
  if (!chips.length) return null
  return (
    <Chips aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.id}>
          <Chip
            onClick={() => onChange(chip.patch)}
            aria-label={`Remove filter ${chip.label}: ${chip.value}`}
            title={`${chip.label}: ${chip.value}`}
          >
            <span className="key">{chip.label}:</span>
            <span className="value">{chip.value}</span>
            <Icon icon="close" />
          </Chip>
        </li>
      ))}
    </Chips>
  )
}

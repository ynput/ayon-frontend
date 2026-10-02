import { FC, ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Button, Icon } from '@ynput/ayon-react-components'
import { JsonViewer } from '@shared/components/JsonViewer'
import { EmptyPlaceholder } from '@shared/components/EmptyPlaceholder'
import { copyToClipboard, getRequestErrorString } from '@shared/util'
import {
  useGetEventByIdQuery,
  useGetEventChildrenQuery,
  useGetEventGqlQuery,
  useGetEventNeighboursQuery,
  useRestartEventMutation,
} from '@queries/events/getEvents'
import type { EventFilters, EventItem } from '../../types'
import {
  getCategory,
  getCategoryMeta,
  getEventEntity,
  getSeverity,
  getSeverityMeta,
  getStatusMeta,
} from '../../utils/eventMeta'
import EntityTile from '../../EntityTile'
import * as Styled from './EventDetails.styled'

const RESTARTABLE = ['finished', 'aborted', 'failed']

export interface EventDetailsProps {
  eventId: string
  /** the event as loaded in the list, shown instantly while details load */
  listEvent?: EventItem
  olderId?: string
  newerId?: string
  onSelect: (id: string | null) => void
  onFilter: (patch: Partial<EventFilters>) => void
}

export const EventDetails: FC<EventDetailsProps> = ({
  eventId,
  listEvent,
  olderId,
  newerId,
  onSelect,
  onFilter,
}) => {
  const isAdmin = useSelector((state: any) => state.user.data.isAdmin)
  const context = useGetEventGqlQuery({ id: eventId }, { skip: !!listEvent?.cursor })
  const event = listEvent ?? context.data ?? undefined
  const parentId = event?.dependsOn
  const { data: parent } = useGetEventGqlQuery({ id: parentId ?? '' }, { skip: !parentId })
  const cursor = event?.cursor ?? context.data?.cursor

  const { data: full } = useGetEventByIdQuery({ id: eventId })
  const { data: neighbours, isFetching: neighboursLoading } = useGetEventNeighboursQuery(
    { cursor: cursor ?? '' },
    { skip: !cursor },
  )
  const { data: children = [] } = useGetEventChildrenQuery({ id: eventId }, { skip: !isAdmin })
  const [restartEvent, { isLoading: isRestarting }] = useRestartEventMutation()

  if (!event) {
    if (context.isLoading) return <Styled.Panel aria-busy />
    return (
      <Styled.Panel>
        <Styled.Header>
          <h2>Event not found</h2>
          <Button
            icon="close"
            variant="text"
            onClick={() => onSelect(null)}
            aria-label="Close details"
          />
        </Styled.Header>
        <EmptyPlaceholder
          icon="search_off"
          message={
            context.error
              ? undefined
              : 'This event no longer exists or is outside the event history.'
          }
          error={context.error}
          ynputError={false}
        />
      </Styled.Panel>
    )
  }

  const status = getStatusMeta(event.status)
  const severity = getSeverityMeta(getSeverity(event))
  const category = getCategoryMeta(getCategory(event.topic))
  const entity = getEventEntity(event)
  const payload = full?.payload ?? {}
  const message: string | undefined = payload.message
  const traceback: string | undefined = payload.traceback

  const handleRestart = async () => {
    try {
      await restartEvent({ id: event.id }).unwrap()
      toast.success('Event restarted')
    } catch (error) {
      toast.error(getRequestErrorString(error))
    }
  }

  const shareLink = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('event', event.id)
    copyToClipboard(url.toString(), true)
  }

  return (
    <Styled.Panel aria-label="Event details">
      <Styled.Header>
        <Icon
          icon={severity?.icon ?? category.icon}
          style={{ color: severity?.color ?? category.color }}
        />
        <h2 title={event.topic}>{event.topic}</h2>
        <Button
          icon="chevron_left"
          variant="text"
          disabled={!olderId}
          onClick={() => olderId && onSelect(olderId)}
          data-tooltip="Older event"
          aria-label="Older event"
        />
        <Button
          icon="chevron_right"
          variant="text"
          disabled={!newerId}
          onClick={() => newerId && onSelect(newerId)}
          data-tooltip="Newer event"
          aria-label="Newer event"
        />
        <Button
          icon="link"
          variant="text"
          onClick={shareLink}
          data-tooltip="Copy link"
          aria-label="Copy link"
        />
        <Button
          icon="close"
          variant="text"
          onClick={() => onSelect(null)}
          data-tooltip="Close"
          aria-label="Close details"
        />
      </Styled.Header>

      <Styled.Body>
        {event.description && <Styled.Description>{event.description}</Styled.Description>}

        <Styled.Facts>
          <Fact label="Time">
            <span title={format(event.createdAt, 'PPpp')}>
              {format(event.createdAt, 'd MMM yyyy, HH:mm:ss.SSS')}
            </span>
            <span className="muted">
              {formatDistanceToNowStrict(event.createdAt, { addSuffix: true })}
              {event.updatedAt - event.createdAt > 1000 &&
                ` · updated ${formatDistanceToNowStrict(event.updatedAt, { addSuffix: true })}`}
            </span>
          </Fact>
          <Fact
            label="Type"
            action={
              <FilterButton
                label={`Show only ${category.label}`}
                onClick={() => onFilter({ types: [getCategory(event.topic)] })}
              />
            }
          >
            <span className="with-icon">
              <span className="dot" style={{ backgroundColor: category.color }} />
              {category.label}
            </span>
            <span className="muted">{event.topic}</span>
          </Fact>
          <Fact
            label="Status"
            action={
              RESTARTABLE.includes(event.status) &&
              !event.topic.startsWith('log.') && (
                <Button
                  icon="replay"
                  variant="text"
                  label="Restart"
                  disabled={isRestarting}
                  onClick={handleRestart}
                  data-tooltip="Set the event status to restarted"
                />
              )
            }
          >
            <span className={clsx('with-icon', 'status', event.status)}>
              <Icon icon={status.icon} />
              {status.label}
            </span>
          </Fact>
          {event.project && (
            <Fact
              label="Project"
              action={
                <>
                  <Link to={`/projects/${event.project}`}>
                    <Button
                      icon="open_in_new"
                      variant="text"
                      data-tooltip="Open project"
                      aria-label="Open project"
                    />
                  </Link>
                  <FilterButton
                    label="Filter by project"
                    onClick={() => onFilter({ projects: [event.project!] })}
                  />
                </>
              }
            >
              {event.project}
            </Fact>
          )}
          {(event.user || event.sender) && (
            <Fact
              label="Source"
              action={
                event.user && (
                  <FilterButton
                    label="Filter by user"
                    onClick={() => onFilter({ users: [event.user!] })}
                  />
                )
              }
            >
              {event.user && <span>{event.user}</span>}
              {event.sender && (
                <span className="muted mono" title="Sender (client or service id)">
                  {event.sender}
                </span>
              )}
            </Fact>
          )}
        </Styled.Facts>

        {entity && (
          <Styled.Section>
            <Styled.SectionTitle>Entity</Styled.SectionTitle>
            {entity.type && event.project ? (
              <EntityTile
                id={entity.id}
                type={entity.type}
                projectName={event.project}
                disableHover
              />
            ) : (
              <span className="mono">{entity.path || entity.id}</span>
            )}
            {entity.path && <span className="muted">{entity.path}</span>}
            {isAdmin && (
              <Button
                icon="timeline"
                label="Entity timeline"
                variant="surface"
                onClick={() => onFilter({ entity: entity.id })}
                data-tooltip="Show all events of this entity"
              />
            )}
          </Styled.Section>
        )}

        {message && (
          <Styled.Section>
            <Styled.SectionTitle>Message</Styled.SectionTitle>
            <Styled.Pre>{message}</Styled.Pre>
          </Styled.Section>
        )}
        {traceback && (
          <Styled.Section>
            <Styled.SectionTitle>Traceback</Styled.SectionTitle>
            <Styled.Pre className="error">{traceback}</Styled.Pre>
          </Styled.Section>
        )}

        {(parent || children.length > 0) && (
          <Styled.Section>
            <Styled.SectionTitle>Related events</Styled.SectionTitle>
            {parent && (
              <>
                <span className="muted">Depends on</span>
                <EventLink event={parent} onSelect={onSelect} />
              </>
            )}
            {children.length > 0 && (
              <>
                <span className="muted">Dependent events ({children.length})</span>
                {children.map((child) => (
                  <EventLink key={child.id} event={child} onSelect={onSelect} />
                ))}
              </>
            )}
          </Styled.Section>
        )}

        <Styled.Section>
          <Styled.SectionTitle>Surrounding events</Styled.SectionTitle>
          {!cursor || (neighboursLoading && !neighbours) ? (
            <span className="muted">Loading…</span>
          ) : (
            <Styled.EventList>
              {neighbours?.newer.map((e) => (
                <EventLink key={e.id} event={e} onSelect={onSelect} />
              ))}
              <EventLink event={event} onSelect={onSelect} current />
              {neighbours?.older.map((e) => (
                <EventLink key={e.id} event={e} onSelect={onSelect} />
              ))}
            </Styled.EventList>
          )}
          <Styled.Hint>All events around this one, ignoring filters</Styled.Hint>
        </Styled.Section>

        <Styled.Disclosure>
          <summary>Summary &amp; payload</summary>
          <JsonViewer value={{ summary: full?.summary ?? event.summary, payload }} wrap />
        </Styled.Disclosure>
        <Styled.Disclosure>
          <summary>Raw event</summary>
          <JsonViewer value={full ?? event} wrap />
        </Styled.Disclosure>
      </Styled.Body>
    </Styled.Panel>
  )
}

const Fact: FC<{ label: string; children: ReactNode; action?: ReactNode }> = ({
  label,
  children,
  action,
}) => (
  <>
    <dt>{label}</dt>
    <dd>
      <div className="value">{children}</div>
      {action && <div className="actions">{action}</div>}
    </dd>
  </>
)

const FilterButton: FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <Button
    icon="filter_alt"
    variant="text"
    onClick={onClick}
    data-tooltip={label}
    aria-label={label}
  />
)

const EventLink: FC<{ event: EventItem; onSelect: (id: string) => void; current?: boolean }> = ({
  event,
  onSelect,
  current,
}) => {
  const severity = getSeverityMeta(getSeverity(event))
  const category = getCategoryMeta(getCategory(event.topic))
  return (
    <Styled.EventLink
      className={clsx({ current })}
      onClick={() => !current && onSelect(event.id)}
      aria-current={current}
      title={event.description}
    >
      <Icon
        icon={severity?.icon ?? category.icon}
        style={{ color: severity?.color ?? category.color }}
      />
      <span className="time">{format(event.createdAt, 'HH:mm:ss')}</span>
      <span className="topic">{event.topic}</span>
      <span className="description">{event.description}</span>
    </Styled.EventLink>
  )
}

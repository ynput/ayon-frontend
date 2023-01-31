import React from 'react'
import { useGetEventByIdQuery } from '/src/services/events/getEvents'
import { Section, Panel, Button } from '@ynput/ayon-react-components'
import DetailHeader from '/src/components/DetailHeader'
import { TimestampField } from '/src/containers/fieldFormat'
import UserTile from '../settings/users/UserTile'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import EventTile from './EventTile'
import { getFuzzyDate } from '/src/utils'

const RowStyled = styled.div`
  span {
    text-overflow: ellipsis;
    overflow: hidden;
    display: block;
  }
`

const EventDetail = ({ id, setSelectedEvent, onFilter, events }) => {
  const { data: event, isLoading, isFetching } = useGetEventByIdQuery({ id }, { skip: !id })

  if (isLoading || !event || !id) return null

  const { description, user: userName, summary, project, payload } = event

  let projectLastUpdated
  if (project) {
    const projectLastest = events.filter((e) => e.project === project)[0]
    projectLastUpdated = projectLastest.updatedAt
  }

  return (
    <Section className={'wrap'} style={{ gap: 4 }}>
      <DetailHeader onClose={() => setSelectedEvent(null)} context={event}>
        <div style={{ overflow: 'hidden' }}>
          <h2>{event.topic}</h2>
          <TimestampField value={event.updatedAt} />
        </div>
      </DetailHeader>
      <Panel
        style={{
          overflow: 'hidden',
        }}
      >
        <RowStyled>
          <h2>Description</h2>
          <span>{description}</span>
        </RowStyled>
        {payload.message && (
          <RowStyled>
            <h2>Message</h2>
            <span>{payload.message}</span>
          </RowStyled>
        )}
        {userName && (
          <RowStyled>
            <h2>User</h2>
            <UserTile userName={userName} suspence={isLoading || isFetching} disableHover>
              <Button
                icon="filter_alt"
                className="transparent"
                onClick={() => onFilter(userName)}
              />
              <Link to={`/settings/users?name=${userName}`}>
                <Button icon="manage_accounts" className="transparent" />
              </Link>
            </UserTile>
          </RowStyled>
        )}
        {project && (
          <RowStyled>
            <h2>Project</h2>
            <EventTile
              title={project}
              disableHover
              subTitle={`Last Updated - ${getFuzzyDate(projectLastUpdated)}`}
            >
              <Button icon="filter_alt" className="transparent" onClick={() => onFilter(project)} />
              <Link to={`/manageProjects/dashboard?project=${project}`}>
                <Button icon="settings_suggest" className="transparent" />
              </Link>
            </EventTile>
          </RowStyled>
        )}
        {summary.entityId && (
          <RowStyled>
            <h2>Entity</h2>
            <span>{summary.entityId}</span>
          </RowStyled>
        )}
      </Panel>
    </Section>
  )
}

export default EventDetail

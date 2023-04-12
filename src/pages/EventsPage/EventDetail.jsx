import React from 'react'
import { useGetEventByIdQuery } from '/src/services/events/getEvents'
import { Section, Panel, Button } from 'ayon-react-components-test'
import DetailHeader from '/src/components/DetailHeader'
import { TimestampField } from '/src/containers/fieldFormat'
import UserTile from '/src/pages/SettingsPage/UsersSettings/UserTile'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import EventTile from './EventTile'
import EntityTile from './EntityTile'
import { formatDistance } from 'date-fns'

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

  const { description, user: userName, summary, project, payload, topic } = event

  let projectLastUpdated, type
  if (project) {
    const projectLastest = events.filter((e) => e.project === project)[0]
    projectLastUpdated = projectLastest.updatedAt

    // get type from topic
    type = topic.split('.')[1]
  }

  return (
    <Section className={'wrap'} style={{ gap: 4 }}>
      <DetailHeader
        onClose={() => setSelectedEvent(null)}
        context={event}
        dialogTitle="Event Context"
      >
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
            <UserTile userName={userName} suspense={isLoading || isFetching} disableHover>
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
              subTitle={`last updated -  ${
                new Date(projectLastUpdated).getDate() &&
                formatDistance(new Date(projectLastUpdated), new Date(), {
                  addSuffix: true,
                })
              }`}
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
            <EntityTile id={summary.entityId} type={type} disableHover projectName={project}>
              <Button icon="filter_alt" className="transparent" onClick={() => onFilter(type)} />
              <Link to={`/projects/${project}/browser?entityId=${summary.entityId}&type=${type}`}>
                <Button icon="open_in_new" className="transparent" />
              </Link>
            </EntityTile>
          </RowStyled>
        )}
      </Panel>
    </Section>
  )
}

export default EventDetail

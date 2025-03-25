import React from 'react'
import { Section, Panel, Button } from '@ynput/ayon-react-components'
import EventTile from './EventTile'
import styled from 'styled-components'

const StyledPanel = styled(Panel)`
  flex-direction: row;
  flex: 4;
  h2 {
    width: 100%;
  }
`

const TotalStyledButton = styled(Button)`
  flex: 1;
`

const EventOverview = ({ events, logs, onTotal, search, setSelectedEvent, setShowLogs }) => {
  const errors = logs.filter((u) => u.topic.startsWith('log.error'))
  const lastError = errors[0]
  const users = events.filter((u) => u.user)
  const lastUser = users[0]

  const handleEventClick = (event) => {
    if (event.topic.startsWith('log.error')) {
      setShowLogs(true)
    } else {
      setShowLogs(false)
    }

    setSelectedEvent(event.id)
  }

  return (
    <Section wrap style={{ gap: '5px', bottom: 'unset', maxHeight: '100%', overflow: 'hidden' }}>
      <StyledPanel style={{ flexWrap: 'wrap' }}>
        <h2>Events Overview</h2>
        <TotalStyledButton
          label={`Error - ${errors.length}`}
          onClick={() => onTotal('error')}
          highlighted={search === 'error'}
        />
        <TotalStyledButton
          label={`Server - ${events.filter((u) => u.topic.startsWith('server')).length}`}
          onClick={() => onTotal('server')}
          highlighted={search === 'server'}
        />
        <TotalStyledButton
          label={`Entity - ${events.filter((u) => u.topic.startsWith('entity')).length}`}
          onClick={() => onTotal('entity')}
          highlighted={search === 'entity'}
        />

        <StyledPanel style={{ padding: 0 }}>
          <TotalStyledButton
            label={`Product - ${events.filter((u) => u.topic.startsWith('entity.product')).length}
        `}
            onClick={() => onTotal('product')}
            highlighted={search === 'product'}
          />
          <TotalStyledButton
            label={`Task - ${events.filter((u) => u.topic.startsWith('entity.task')).length}
        `}
            onClick={() => onTotal('task')}
            highlighted={search === 'task'}
          />
          <TotalStyledButton
            label={`Version - ${events.filter((u) => u.topic.startsWith('entity.version')).length}
        `}
            onClick={() => onTotal('version')}
            highlighted={search === 'version'}
          />
        </StyledPanel>
      </StyledPanel>

      <Panel>
        <h2>Last Error</h2>
        {lastError ? (
          <EventTile
            title={lastError.description}
            time={lastError.updatedAt}
            subTitle={lastError.topic}
            onClick={() => handleEventClick(lastError)}
          />
        ) : (
          <EventTile title="No Errors Found" disableHover />
        )}
        <h2>Last User</h2>
        {lastUser ? (
          <EventTile
            title={lastUser.topic}
            time={lastUser.updatedAt}
            subTitle={lastUser.user}
            onClick={() => handleEventClick(lastUser)}
          />
        ) : (
          <EventTile title="No Users Found" disableHover />
        )}
      </Panel>
    </Section>
  )
}

export default EventOverview

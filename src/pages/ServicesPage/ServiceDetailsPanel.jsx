import { useState } from 'react'
import { Button, Panel, Section } from '@ynput/ayon-react-components'
import { format } from 'date-fns'
import styled from 'styled-components'
import ServiceDialog from './NewServiceDialog'

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 8px;
  align-items: flex-start;
`

const Label = styled.div`
  font-weight: 600;
  min-width: 140px;
  color: var(--text-color-secondary);
`

const Value = styled.div`
  flex-grow: 1;
  overflow-wrap: break-word;
  word-break: break-word;
`

const JsonWrapper = styled.div`
  margin-top: 16px;
`

const JsonDisplay = styled.pre`
  background-color: var(--surface-ground);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  color: var(--text-color);
  font-family: monospace;
  font-size: 0.9rem;
  overflow-y: auto;
  white-space: break-spaces;
`

const ServiceDetailsPanel = ({ service, onClose, onEdit }) => {
  return (
    <Section style={{ height: '100%' }}>
      <Panel style={{ height: '100%', overflowY: 'auto' }}>
        <Header>
          <h2>{service.name}</h2>

          <ButtonGroup>
            <Button icon="edit" variant="text" onClick={() => onEdit(service)} />
            <Button icon="close" variant="text" onClick={onClose} />
          </ButtonGroup>
        </Header>
        <DetailRow>
          <Label>Host:</Label>
          <Value>{service.hostname}</Value>
        </DetailRow>
        <DetailRow>
          <Label>Addon:</Label>
          <Value>{service.addonName}</Value>
        </DetailRow>
        <DetailRow>
          <Label>Addon Version:</Label>
          <Value>{service.addonVersion}</Value>
        </DetailRow>
        <DetailRow>
          <Label>Service Type:</Label>
          <Value>{service.service}</Value>
        </DetailRow>
        <DetailRow>
          <Label>Should Run:</Label>
          <Value>{service.shouldRun ? 'Yes' : 'No'}</Value>
        </DetailRow>
        <DetailRow>
          <Label>Is Running:</Label>
          <Value>{service.isRunning ? 'Yes' : 'No'}</Value>
        </DetailRow>
        {service.lastSeen && (
          <DetailRow>
            <Label>Last Seen:</Label>
            <Value>{format(service.lastSeen, 'dd/MM/yy hh:mm')}</Value>
          </DetailRow>
        )}
        {service.data && (
          <JsonWrapper>
            <h4>Service Data</h4>
            <JsonDisplay>{JSON.stringify(service.data, null, 2)}</JsonDisplay>
          </JsonWrapper>
        )}
      </Panel>
    </Section>
  )
}

export default ServiceDetailsPanel

import React from 'react'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetProjectDashboardQuery } from '/src/services/getProjectDashboard'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const RowStyled = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 8px;

  :first-child {
    margin-top: 8px;

    button:nth-child(2) {
      flex: 0.5;
      min-width: fit-content;
    }
  }

  button {
    flex: 1;
    overflow: hidden;
  }
`

const ProjectUsers = ({ projectName }) => {
  let { data = {}, isError } = useGetProjectDashboardQuery({ projectName, panel: 'users' })

  const { total = 0, active = 0, admins = 0, managers = 0, services = 0 } = data

  return (
    <DashboardPanelWrapper isError={isError}>
      <RowStyled>
        <Button label={`Total Users - ${total}`} />
        <Button label={`Active - ${active}`} />
        <Link to={'/settings/users'}>
          <Button icon="manage_accounts" />
        </Link>
      </RowStyled>
      <RowStyled>
        <Button label={`Admins - ${admins}`} />
        <Button label={`Managers - ${managers}`} />
        <Button label={`Services - ${services}`} />
      </RowStyled>
    </DashboardPanelWrapper>
  )
}

export default ProjectUsers

import React from 'react'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetProjectDashboardQuery } from '@queries/getProjectDashboard'
import styled from 'styled-components'
import clsx from 'clsx'

const RowStyled = styled.div`
  padding-top: 8px;
  font-size: 16px;
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 16px;
`

const ProjectUsers = ({ projectName }) => {
  let { data = {}, isFetching } = useGetProjectDashboardQuery({
    projectName,
    panel: 'users',
  })

  const { teamSizeActive = 0, teamSizeTotal = 0, usersWithAccessTotal = 0 } = data

  return (
    <DashboardPanelWrapper className={clsx({ loading: isFetching }, 'shimmer-dark')}>
      <RowStyled>
        <strong>Teams Total - {teamSizeTotal}</strong> | <strong>Active - {teamSizeActive}</strong>{' '}
        | <strong>Access - {usersWithAccessTotal}</strong>
      </RowStyled>
    </DashboardPanelWrapper>
  )
}

export default ProjectUsers

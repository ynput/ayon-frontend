import React from 'react'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetProjectDashboardQuery } from '/src/services/getProjectDashboard'
import styled from 'styled-components'

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
  let {
    data: { counts = {} } = {},
    isError,
    isFetching,
    isLoading,
  } = useGetProjectDashboardQuery({
    projectName,
    panel: 'users',
  })

  const { total = 0, active = 0 } = counts

  return (
    <DashboardPanelWrapper isError={isError} isLoading={isLoading || isFetching}>
      <RowStyled>
        <strong>Total Users - {total}</strong> | <strong>Active Users - {active}</strong>
      </RowStyled>
    </DashboardPanelWrapper>
  )
}

export default ProjectUsers

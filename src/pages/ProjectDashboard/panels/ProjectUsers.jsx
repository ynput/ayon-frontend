import React from 'react'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetProjectDashboardQuery } from '/src/services/getProjectDashboard'
import styled from 'styled-components'
import getShimmerStyles from '/src/styles/getShimmerStyles'

const RowStyled = styled.div`
  padding-top: 8px;
  font-size: 16px;
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 16px;
`
const StyledLoading = styled.div`
  position: absolute;
  inset: 8px;
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius);
  ${getShimmerStyles()}
`

const ProjectUsers = ({ projectName }) => {
  let { data = {}, isFetching } = useGetProjectDashboardQuery({
    projectName,
    panel: 'users',
  })

  const { teamSizeActive = 0, teamSizeTotal = 0, usersWithAccessTotal = 0 } = data

  return (
    <DashboardPanelWrapper>
      <RowStyled>
        <strong>Teams Total - {teamSizeTotal}</strong> | <strong>Active - {teamSizeActive}</strong>{' '}
        | <strong>Access - {usersWithAccessTotal}</strong>
      </RowStyled>
      {isFetching && <StyledLoading />}
    </DashboardPanelWrapper>
  )
}

export default ProjectUsers

import React from 'react'
import { useGetTeamsQuery } from '../../services/team/getTeams'
import TeamList from '/src/containers/TeamList'
import { ArrayParam, useQueryParam, withDefault } from 'use-query-params'
import { Button, Section } from '@ynput/ayon-react-components'
import ProjectManagerPageLayout from '../ProjectManagerPage/ProjectManagerPageLayout'

const TeamsPage = ({ projectName, projectList, toolbar }) => {
  const { data: teams = [], isLoading } = useGetTeamsQuery({ projectName }, { skip: !projectName })

  const [selectedTeams, setSelectedTeams] = useQueryParam(
    ['teams'],
    withDefault(ArrayParam, [teams[0]?.name]),
  )

  return (
    <ProjectManagerPageLayout
      projectList={projectList}
      toolbar={toolbar}
      toolbarMore={
        <>
          <Button icon={'playlist_add'} label="Create New Team" />
          <Button icon={'content_copy'} label="Duplicate Team" />
          <Button icon={'delete'} label="Delete Teams" />
        </>
      }
    >
      <Section
        style={{
          flexDirection: 'row',
        }}
      >
        <TeamList
          teams={teams}
          selection={selectedTeams}
          isLoading={isLoading}
          multiselect
          onSelect={(teams) => setSelectedTeams(teams)}
          styleSection={{ height: '100%' }}
        />
      </Section>
    </ProjectManagerPageLayout>
  )
}

export default TeamsPage

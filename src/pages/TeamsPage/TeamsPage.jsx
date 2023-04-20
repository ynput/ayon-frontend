import React from 'react'
import { useGetTeamsQuery } from '../../services/team/getTeams'
import TeamList from '/src/containers/TeamList'
import { ArrayParam, useQueryParam, withDefault } from 'use-query-params'
import { Section } from '@ynput/ayon-react-components'

const TeamsPage = ({ projectName }) => {
  const { data: teams = [], isLoading } = useGetTeamsQuery({ projectName }, { skip: !projectName })

  const [selectedTeams, setSelectedTeams] = useQueryParam(
    ['teams'],
    withDefault(ArrayParam, [teams[0]?.name]),
  )

  return (
    <Section>
      <TeamList
        teams={teams}
        selection={selectedTeams}
        isLoading={isLoading}
        multiselect
        onSelect={(teams) => setSelectedTeams(teams)}
      />
    </Section>
  )
}

export default TeamsPage

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import UserDetailsHeader from '/src/components/User/UserDetailsHeader'
import {
  Dropdown,
  FormLayout,
  FormRow,
  InputSwitch,
  OverflowField,
  Panel,
} from '@ynput/ayon-react-components'

const getFieldValues = (users, field, selectedTeams) => {
  let values = []
  let isMultiple = false

  users.forEach((user, i) => {
    // get all values for each team user is in
    const userValues = []
    for (const teamName in user.teams) {
      // check if team is selected
      if (selectedTeams && !selectedTeams.includes(teamName)) continue
      // get team object
      const team = user.teams[teamName]
      if (!team) continue
      // get field value
      const value = field ? team[field] : teamName
      if (value === undefined || value === null) continue

      //   if value is an array, add each value to userValues
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (!userValues.includes(v)) {
            userValues.push(v)
          }
        })
      } else {
        userValues.push(value)
      }
    }

    //   add values to final values array (no duplicates)
    userValues.forEach((value) => {
      if (!values.includes(value)) {
        values.push(value)
      }
    })

    //   check if value is ever different
    if (users.length > 1 && i > 0 && !isMultiple) {
      //  if not, set isMultiple to true
      isMultiple = !(
        values.every((v) => userValues.includes(v)) && values.length === userValues.length
      )
    }
  })

  return [values, isMultiple]
}

const TeamUsersDetails = ({
  users = [],
  teams = [],
  selectedTeams = [],
  rolesList = [],
  onUpdateTeams,
  isFetching,
}) => {
  const noUsers = users.length === 0

  //   check if at least one user is on at least one selected team
  const isOnAllTeams = users.some((user) => {
    for (const teamName in user.teams) {
      if (selectedTeams.includes(teamName)) return true
    }
    return false
  })

  const disableForm = noUsers || !isOnAllTeams || isFetching

  const [teamsValue, teamMultiple] = useMemo(() => getFieldValues(users), [users])

  const [rolesValue, rolesMultiple] = useMemo(
    () => getFieldValues(users, 'roles', selectedTeams),
    [users, selectedTeams],
  )

  const [leaderValue, leaderMultiple] = useMemo(
    () => getFieldValues(users, 'leader', selectedTeams),
    [users, selectedTeams],
  )

  const rolesOptions = useMemo(() => rolesList.map((role) => ({ name: role })), [rolesList])

  const formSubtitle = noUsers
    ? 'No Users Selected'
    : isOnAllTeams
    ? 'Setting On Selected Teams'
    : `Not on ${selectedTeams.join(', ')}`

  const subTitle =
    users.length > 1
      ? users.map((user) => user.name).join(', ')
      : teamsValue.length
      ? teamsValue.join(', ')
      : 'No team'

  //   HANDLERS

  const handleTeamChange = async (newTeams = []) => {
    const addedTeams = newTeams.filter((team) => !teamsValue.includes(team))
    const removedTeams = teamsValue.filter((team) => !newTeams.includes(team))

    // add/remove all users to teams
    const updatedTeamsWithNewMembers = {}
    teams.forEach((team) => {
      // remove out the selected users from the team
      const membersWithRemovedUsers = team.members.filter(
        (member) => !users.some((user) => user.name === member.name),
      )

      if (addedTeams.includes(team.name)) {
        // create new users array with updated roles and leader
        // if user is already on team, keep their roles and leader
        const newUsersToAdd = users.map((user) => ({
          name: user.name,
          leader: false,
          roles: [],
          ...user.teams[team.name],
        }))

        // now merge new users with existing team members
        const newMembers = [...membersWithRemovedUsers, ...newUsersToAdd]

        // add selected members to new team
        updatedTeamsWithNewMembers[team.name] = {
          ...team,
          members: newMembers,
        }
      } else if (removedTeams.includes(team.name)) {
        // remove members from team
        updatedTeamsWithNewMembers[team.name] = {
          ...team,
          members: membersWithRemovedUsers,
        }
      }
    })

    onUpdateTeams(updatedTeamsWithNewMembers)
  }

  return (
    <>
      <UserDetailsHeader
        users={users}
        style={{ flex: 'unset' }}
        subTitle={<OverflowField value={subTitle} align="left" />}
      />
      <Panel>
        <FormLayout>
          <FormRow label="On Teams" style={{ overflow: 'hidden' }}>
            <Dropdown
              value={teamsValue}
              options={teams}
              dataKey="name"
              dataLabel="name"
              widthExpand
              multiSelect
              isMultiple={teamMultiple}
              disabled={noUsers || isFetching}
              onChange={handleTeamChange}
            />
          </FormRow>
          <h2>{formSubtitle}</h2>
          <FormRow label="Roles" style={{ overflow: 'hidden' }}>
            <Dropdown
              value={rolesValue}
              options={rolesOptions}
              dataKey="name"
              dataLabel="name"
              widthExpand
              multiSelect
              isMultiple={rolesMultiple}
              disabled={disableForm}
              search
              searchFields={['name']}
            />
          </FormRow>
          <FormRow label="Leader" style={{ overflow: 'hidden' }}>
            <InputSwitch
              checked={leaderValue.some((v) => v) && !leaderMultiple}
              onChange={() => console.log('checked')}
              disabled={disableForm}
            />
          </FormRow>
        </FormLayout>
      </Panel>
    </>
  )
}

TeamUsersDetails.propTypes = {
  selectedTeams: PropTypes.arrayOf(PropTypes.string),
  rolesList: PropTypes.arrayOf(PropTypes.string),
}

export default TeamUsersDetails

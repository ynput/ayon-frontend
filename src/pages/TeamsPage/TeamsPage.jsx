import React, { useMemo, useState } from 'react'
import { useGetTeamsQuery } from '../../services/team/getTeams'
import TeamList from '/src/containers/TeamList'
import { ArrayParam, useQueryParam, withDefault } from 'use-query-params'
import { Button, InputSwitch, Section } from '@ynput/ayon-react-components'
import ProjectManagerPageLayout from '../ProjectManagerPage/ProjectManagerPageLayout'
import UserListTeams from './UserListTeams'
import { useGetUsersQuery } from '/src/services/user/getUsers'
import TeamUsersDetails from './TeamUsersDetails'
import TeamDetails from './TeamDetails'
import { useUpdateTeamMutation } from '/src/services/team/updateTeams'
import { toast } from 'react-toastify'
import { ayonApi } from '/src/services/ayon'
import { useDispatch } from 'react-redux'

const TeamsPage = ({ projectName, projectList, toolbar, isUser }) => {
  // REDUX STATE
  const dispatch = useDispatch()

  // STATES
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showTeamUsersOnly, setShowTeamUsersOnly] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // RTK QUERY HOOKS
  const { data: teams = [], isLoading: isLoadingTeams } = useGetTeamsQuery(
    { projectName, showMembers: true },
    { skip: !projectName },
  )

  let { data: users = [], isLoading: isLoadingUsers } = useGetUsersQuery(
    {},
    { skip: !projectName || isUser },
  )

  // RTK MUTATIONS
  // update team
  const [updateTeam] = useUpdateTeamMutation()
  // update team member
  // const [updateTeamMember] = useUpdateTeamMutation()
  // delete team
  // const [deleteTeam] = useUpdateTeamMutation()
  // delete team member
  // const [deleteTeamMember] = useUpdateTeamMutation()

  // const [getUser] = useLazyGetUserQuery()

  const [selectedTeams, setSelectedTeams] = useQueryParam(
    ['teams'],
    withDefault(ArrayParam, [teams[0]?.name]),
  )

  // Merge users and teams data
  // NOTE: there is a usersObject bellow [userList, usersObject]
  let [userList] = useMemo(() => {
    const usersObject = {}
    const userList = []

    // isUser doesn't have access to users list
    if (!isUser || !users) {
      // admins and managers for editing
      users.forEach((user) => {
        usersObject[user.name] = { teams: {} }

        teams.forEach((team) => {
          const member = team.members.find((member) => member.name === user.name)
          if (member) {
            usersObject[user.name].teams[team.name] = {
              leader: member.leader,
              roles: member.roles,
            }
          }
        })

        // Include any other user data in the merged object
        usersObject[user.name] = { ...usersObject[user.name], ...user }

        userList.push(usersObject[user.name])
      })
    } else {
      // users for viewing
      // we need to get the users from the teams
      teams.forEach((team) => {
        team.members.forEach((member) => {
          if (!usersObject[member.name]) {
            const user = {
              name: member.name,
              teams: {
                [team.name]: {
                  leader: member.leader,
                  roles: member.roles,
                },
              },
            }
            usersObject[member.name] = user
            userList.push(user)
          } else {
            usersObject[member.name].teams[team.name] = {
              leader: member.leader,
              roles: member.roles,
            }
          }
        })
      })
    }
    return [userList, usersObject]
  }, [users, teams])

  // // teams might have users no longer exist
  // const missingUsers = []
  // // find users in teams that are not in the users list
  // if (!isUser) {
  //   teams.forEach((team) => {
  //     team.members.forEach((member) => {
  //       if (!usersObject[member.name]) {
  //         const missingUser = {
  //           name: member.name,
  //           isMissing: true,
  //           teams: {
  //             [team.name]: {
  //               leader: member.leader,
  //               roles: member.roles,
  //             },
  //           },
  //         }
  //         missingUsers.push(missingUser)
  //         usersObject[member.name] = missingUser
  //         userList.push(missingUser)
  //       }
  //     })
  //   })
  // }

  // filter users by team if showTeamUsersOnly is true
  userList = useMemo(() => {
    let filteredUsers = userList

    if (showTeamUsersOnly) {
      filteredUsers = filteredUsers.filter((user) => selectedTeams.some((team) => user.teams[team]))
    }

    return filteredUsers
  }, [showTeamUsersOnly, userList, selectedTeams])

  // find all roles on all teams
  const rolesList = useMemo(() => {
    const roles = new Set()
    teams.forEach((team) => {
      team.members.forEach((member) => {
        member.roles.forEach((role) => {
          roles.add(role)
        })
      })
    })
    return Array.from(roles)
  }, [teams])

  // find all roles on all teams, with the team name as a key
  // {[teamName]: [roles], ...}
  // const rolesObject = useMemo(() => {
  //   const roles = {}
  //   teams.forEach((team) => {
  //     roles[team.name] = []
  //     team.members.forEach((member) => {
  //       member.roles.forEach((role) => {
  //         if (!roles[team.name].includes(role)) roles[team.name].push(role)
  //       })
  //     })
  //   })
  //   return roles
  // })

  // only show selected users in the user details panel
  const selectedUsersArray = useMemo(() => {
    return userList.filter((user) => selectedUsers.includes(user.name))
  }, [userList, selectedUsers])

  // HANDLERS

  const handleUpdateTeam = async (teamName, teamObject, disableInvalidate, optimisticUpdate) => {
    try {
      await updateTeam({
        projectName,
        teamName,
        team: teamObject,
        disableInvalidate,
        optimisticUpdate,
      }).unwrap()

      return { error: false, success: true }
    } catch (error) {
      console.error(error)
      // toast
      return { error: true, success: false }
    }
  }

  const handleUpdateTeams = async (teams = {}) => {
    const useOptimisticUpdate = Object.keys(teams).length === 1
    const errors = []
    const success = []

    if (!useOptimisticUpdate) setIsUpdating(true)

    // disable invalidate for all teams and then invalidate at the end
    for (const teamName of Object.keys(teams)) {
      const res = await handleUpdateTeam(teamName, teams[teamName], true, useOptimisticUpdate)
      if (res.error) errors.push(teamName)
      if (res.success) success.push(teamName)
    }

    if (!useOptimisticUpdate) {
      // trigger invalidate
      dispatch(ayonApi.util.invalidateTags(['teams']))
      setIsUpdating(false)
    }

    // toast error errors
    if (errors.length) toast.error(`Failed to update ${errors.join(', ')}`)

    // success toast
    if (success.length) toast.success(`Updated ${success.join(', ')}`)
  }

  const isLoading = isLoadingUsers || isLoadingTeams || isUpdating

  return (
    <ProjectManagerPageLayout
      projectList={projectList}
      toolbar={toolbar}
      toolbarMore={
        <>
          {!isUser && (
            <>
              <Button icon={'playlist_add'} label="Create New Team" />
              <Button icon={'content_copy'} label="Duplicate Team" />
              <Button icon={'delete'} label="Delete Teams" />
            </>
          )}
          <InputSwitch
            checked={!showTeamUsersOnly}
            onChange={() => setShowTeamUsersOnly(!showTeamUsersOnly)}
          />
          Show All Users
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
          isLoading={isLoadingTeams}
          multiselect
          onSelect={(teams) => setSelectedTeams(teams)}
          styleSection={{ height: '100%', flex: 0.4 }}
        />
        <UserListTeams
          selectedProjects={[projectName]}
          selectedUsers={selectedUsers}
          onSelectUsers={(users) => setSelectedUsers(users)}
          userList={userList}
          isLoading={isLoading}
          selectedTeams={selectedTeams}
        />
        <Section
          style={{
            alignItems: 'start',
            height: '100%',
            flex: 1,
            maxWidth: 480,
            minWidth: 480,
          }}
        >
          <TeamUsersDetails
            users={selectedUsersArray}
            teams={teams}
            selectedTeams={selectedTeams}
            rolesList={rolesList}
            onUpdateTeams={handleUpdateTeams}
            isFetching={isUpdating || isLoading}
          />
          <TeamDetails teams={teams} selectedTeams={selectedTeams} />
        </Section>
      </Section>
    </ProjectManagerPageLayout>
  )
}

export default TeamsPage

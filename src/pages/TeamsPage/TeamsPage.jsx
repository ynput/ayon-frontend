import React, { useMemo, useRef, useState } from 'react'
import { useGetTeamsQuery } from '../../services/team/getTeams'
import TeamList from '/src/containers/TeamList'
import { ArrayParam, useQueryParam, withDefault } from 'use-query-params'
import { Button, InputSwitch, Section } from '@ynput/ayon-react-components'
import ProjectManagerPageLayout from '../ProjectManagerPage/ProjectManagerPageLayout'
import UserListTeams from './UserListTeams'
import { useGetUsersQuery } from '/src/services/user/getUsers'
import TeamUsersDetails from './TeamUsersDetails'
import TeamDetails from './TeamDetails'
import { useDeleteTeamMutation, useUpdateTeamMutation } from '/src/services/team/updateTeams'
import { toast } from 'react-toastify'
import { ayonApi } from '/src/services/ayon'
import { useDispatch } from 'react-redux'
import CreateNewTeam from './CreateNewTeam'
import { confirmDialog } from 'primereact/confirmdialog'

const TeamsPage = ({ projectName, projectList, isUser }) => {
  // REDUX STATE
  const dispatch = useDispatch()

  // STATES
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showTeamUsersOnly, setShowTeamUsersOnly] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [createTeamOpen, setCreateTeamOpen] = useState(false)

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
  // delete team
  const [deleteTeam] = useDeleteTeamMutation()

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

  // UPDATE TEAM
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

  // UPDATE TEAMS
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

  // CREATE TEAM
  const handleNewTeam = async (team) => {
    let { name } = team

    // check if name is already taken
    if (teams.some((team) => team.name === name)) {
      toast.warning('Team name already taken')
      return
    }

    const { error, success } = await handleUpdateTeam(name, team, true, true)

    // toast error errors
    if (error) toast.error(`Failed to create ${name}`)

    // success toast
    if (success) {
      setCreateTeamOpen(false)
      setSelectedTeams([name])
      toast.success(`Created ${name}`)
    }
  }

  const toastId = useRef(null)
  // DELETE TEAM
  const onDelete = async () => {
    confirmDialog({
      message: `Are you sure you want to delete ${selectedTeams.length} team(s)?`,
      header: 'Delete Teams',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        toastId.current = toast.info('Deleting teams...')
        let i = 0
        for (const team of selectedTeams) {
          try {
            setSelectedUsers([])
            await deleteTeam({ projectName, teamName: team }).unwrap()
            toast.update(toastId.current, {
              render: `Deleted team: ${team}`,
              type: toast.TYPE.SUCCESS,
            })
            setSelectedTeams((teams) => teams.filter((t) => t !== team))
            i += 1
          } catch {
            toast.error(`Unable to delete team: ${team}`)
          }
        }
        toast.update(toastId.current, { render: `Deleted ${i} teams(s)`, type: toast.TYPE.SUCCESS })
      },
      reject: () => {},
    })
  }

  const isLoading = isLoadingUsers || isLoadingTeams || isUpdating

  return (
    <>
      <ProjectManagerPageLayout
        projectList={projectList}
        toolbarMore={
          <>
            {!isUser && (
              <>
                <Button
                  icon={'group_add'}
                  label="Create New Team"
                  onClick={() => setCreateTeamOpen(true)}
                />
                <Button icon={'content_copy'} label="Duplicate Team" />
                <Button
                  icon={'delete'}
                  label="Delete Teams"
                  onClick={onDelete}
                  disabled={!selectedTeams.length}
                />
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
            onDelete={onDelete}
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
            {createTeamOpen ? (
              <CreateNewTeam
                rolesList={rolesList}
                isOpen={createTeamOpen}
                onClose={setCreateTeamOpen}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                allUsers={userList}
                onCreate={handleNewTeam}
              />
            ) : (
              <>
                <TeamUsersDetails
                  users={selectedUsersArray}
                  teams={teams}
                  selectedTeams={selectedTeams}
                  rolesList={rolesList}
                  onUpdateTeams={handleUpdateTeams}
                  isFetching={isUpdating || isLoading}
                />
                <TeamDetails teams={teams} selectedTeams={selectedTeams} />
              </>
            )}
          </Section>
        </Section>
      </ProjectManagerPageLayout>
    </>
  )
}

export default TeamsPage

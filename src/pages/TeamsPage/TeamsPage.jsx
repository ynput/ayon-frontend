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
import styled from 'styled-components'

const SectionStyled = styled(Section)`
  align-items: start;
  height: 100%;
  flex: 1 1 0%;

  min-width: 450px;
  max-width: 450px;

  /* maxWidth smaller min-width */
  @media (max-width: 1200px) {
    min-width: 370px;
  }

  /* maxWidth smaller min-width */
  @media (max-width: 1024px) {
    min-width: 320px;
  }
`

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

  //   create array of all roles for selected teams
  const selectedTeamsRoles = useMemo(() => {
    const roles = []
    teams.forEach((team) => {
      if (selectedTeams.includes(team.name)) {
        team.members.forEach((member) => {
          member.roles.forEach((role) => {
            if (!roles.includes(role)) {
              roles.push(role)
            }
          })
        })
      }
    })
    return roles
  }, [teams, selectedTeams])

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
  const handleNewTeam = async (team, config) => {
    const { noToast = false } = config || {}
    let { name } = team

    // check if name is already taken
    if (teams.some((team) => team.name.toLowerCase() === name.toLowerCase())) {
      toast.warning('Team name already taken')
      return
    }

    const { error, success } = await handleUpdateTeam(name, team, true, true)

    // toast error errors
    if (error) toast.error(`Failed to create ${name}`)

    // success toast
    if (success && !noToast) {
      setCreateTeamOpen(false)
      setSelectedTeams([name])
      toast.success(`Created ${name}`)
    }
  }

  // HANDLE DELETE TEAMS
  const handleDeleteTeams = async (names = [], config) => {
    const { noToast = false } = config || {}
    toastId.current = !noToast && toast.info('Deleting teams...')
    setSelectedUsers([])
    let i = 0
    for (const teamName of names) {
      try {
        await deleteTeam({ projectName, teamName }).unwrap()
        !noToast &&
          toast.update(toastId.current, {
            render: `Deleted team: ${teamName}`,
            type: toast.TYPE.SUCCESS,
          })
        setSelectedTeams((teams) => teams.filter((t) => t !== teamName))
        i += 1
      } catch {
        toast.error(`Unable to delete team: ${teamName}`)
      }
    }
    !noToast &&
      toast.update(toastId.current, { render: `Deleted ${i} teams(s)`, type: toast.TYPE.SUCCESS })
  }

  // HANDLE RENAME TEAM
  const handleRenameTeam = async (oldName, newName) => {
    // check it's not the oldName
    if (oldName === newName) return

    // check if name is already taken
    if (teams.some((team) => team.name.toLowerCase() === newName.toLowerCase())) {
      toast.warning('Team name already taken')
      return
    }

    const oldTeam = teams.find((team) => team.name === oldName)

    const newTeam = {
      members: oldTeam.members,
      name: newName,
    }

    try {
      setIsUpdating(true)
      // first create duplicate team with new name
      await handleNewTeam(newTeam, { noToast: true })
      // then delete old team
      await handleDeleteTeams([oldName], { noToast: true })
      // then select new team
      setSelectedTeams([newName])
      toast.success(`Renamed team: ${oldName} to ${newName}`)
    } catch {
      toast.error(`Unable to rename team: ${oldName}`)
    }
    setIsUpdating(false)
  }

  const toastId = useRef(null)
  // DELETE TEAM
  const onDelete = async () => {
    confirmDialog({
      message: `Are you sure you want to delete ${selectedTeams.length} team(s)?`,
      header: 'Delete Teams',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        handleDeleteTeams(selectedTeams)
      },
      reject: () => {},
    })
  }

  // DUPLICATE TEAM
  const onDuplicate = async () => {
    // preselect all users on selected team
    const teamUsers = userList
      .filter((user) => selectedTeams.some((team) => user.teams[team]))
      .map((user) => user.name)

    setSelectedUsers(teamUsers)

    setCreateTeamOpen({
      roles: selectedTeamsRoles,
      subTitle: `Duplicating ${selectedTeams[0]}`,
      duplicate: selectedTeams[0],
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
                <Button
                  icon={'content_copy'}
                  label="Duplicate Team"
                  disabled={selectedTeams.length !== 1}
                  onClick={onDuplicate}
                />
                <Button
                  icon={'delete'}
                  label="Delete Teams"
                  disabled={!selectedTeams.length}
                  onClick={onDelete}
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
            width: 'calc(100% - 230px)',
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
          <SectionStyled>
            {createTeamOpen ? (
              <CreateNewTeam
                rolesList={rolesList}
                createTeamOpen={createTeamOpen}
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
                <TeamDetails
                  teams={teams}
                  selectedTeams={selectedTeams}
                  onUpdateTeams={handleUpdateTeams}
                  roles={selectedTeamsRoles}
                  onRenameTeam={(v) => handleRenameTeam(selectedTeams[0], v)}
                />
              </>
            )}
          </SectionStyled>
        </Section>
      </ProjectManagerPageLayout>
    </>
  )
}

export default TeamsPage

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGetTeamsQuery } from '@queries/team/getTeams'
import TeamList from '@containers/TeamList'
import { ArrayParam, useQueryParam } from 'use-query-params'
import {
  Button,
  InputSwitch,
  InputText,
  SaveButton,
  Section,
  Spacer,
  Dialog,
} from '@ynput/ayon-react-components'
import ProjectManagerPageLayout from '../ProjectManagerPage/ProjectManagerPageLayout'
import UserListTeams from './UserListTeams'
import { useGetUsersQuery } from '@queries/user/getUsers'
import TeamUsersDetails from './TeamUsersDetails'
import TeamDetails from './TeamDetails'
import { useDeleteTeamMutation, useUpdateTeamsMutation } from '@queries/team/updateTeams'
import { toast } from 'react-toastify'
import CreateNewTeam from './CreateNewTeam/CreateNewTeam'
import styled from 'styled-components'
import useSearchFilter from '@hooks/useSearchFilter'
import { useSearchParams } from 'react-router-dom'
import { confirmDelete } from '@shared/helpers'

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
  // QUERY PARAMS STATE
  const [searchParams] = useSearchParams()
  const queryNames = searchParams.getAll('name')

  // STATES
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showTeamUsersOnly, setShowTeamUsersOnly] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  // duplicate team
  const [duplicateTeamNameVisible, setDuplicateTeamNameVisible] = useState(false)
  const [duplicateTeamName, setDuplicateTeamName] = useState('')

  // Set selected users based on query params
  // set initial selected users
  useEffect(() => {
    if (queryNames.length) {
      setSelectedUsers(queryNames)
      // remove from url
      searchParams.delete('name')
      window.history.replaceState({}, '', `${window.location.pathname}?${searchParams}`)
    }
  }, [])

  // RTK QUERY HOOKS
  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    isError: isErrorTeams,
  } = useGetTeamsQuery({ projectName, showMembers: true }, { skip: !projectName })
  if (isErrorTeams) toast.error('Unable to load teams')

  let {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useGetUsersQuery({}, { skip: !projectName || isUser })

  if (isErrorUsers || !Array.isArray(users)) {
    toast.error('Unable to load users')
    users = []
  }

  // filter out users that have 0 accessGroups for the selected projects
  users = users.filter(
    (user) =>
      user.isAdmin ||
      user.isManager ||
      (user.accessGroups[projectName] && user.accessGroups[projectName].length),
  )

  // RTK MUTATIONS
  // delete team
  const [deleteTeam] = useDeleteTeamMutation()
  // update multiple teams
  const [updateTeams, { isLoading: isUpdatingTeams }] = useUpdateTeamsMutation()

  const [selectedTeams = [], setSelectedTeams] = useQueryParam(['teams'], ArrayParam)

  // Merge users and teams data
  // NOTE: there is a usersObject below [userList, usersObject]
  let [userList] = useMemo(() => {
    const usersObject = {}
    const userList = []

    // isUser doesn't have access to users list
    if (!isUser || !users) {
      // admins and managers for editing
      users.forEach((user) => {
        usersObject[user.name] = { teams: {} }
        const teamsList = []
        let rolesList = []
        let leader = false

        teams.forEach((team) => {
          const member = team.members.find((member) => member.name === user.name)
          if (member) {
            usersObject[user.name].teams[team.name] = {
              leader: member.leader,
              roles: member.roles,
            }
            teamsList.push(team.name)
            rolesList = [...rolesList, ...member.roles]
            leader = member.leader
          }
        })

        const isTeamSelected = selectedTeams.some((team) => teamsList.includes(team))

        const group = isTeamSelected
          ? 'On A Selected Team'
          : teamsList.filter((t) => !selectedTeams.includes(t)).length
          ? selectedTeams.length
            ? 'On Other Teams'
            : 'On Teams'
          : 'On No Teams'

        // Include any other user data in the merged object
        usersObject[user.name] = {
          ...usersObject[user.name],
          ...user,
          teamsList,
          rolesList,
          isTeamSelected: isTeamSelected,
          group,
          leader,
        }

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
  }, [users, teams, selectedTeams])

  // SORTING
  userList = useMemo(() => {
    const sortedList = [...userList]
    // sort users by name
    sortedList.sort((a, b) => a.name.localeCompare(b.name))

    // then sort by how many teams they are on
    sortedList.sort((a, b) => {
      const aTeams = Object.keys(a.teams).length
      const bTeams = Object.keys(b.teams).length

      if (aTeams > bTeams) return -1
      if (aTeams < bTeams) return 1
      return 0
    })

    // sort by if on selected teams
    sortedList.sort((a, b) => {
      const aOnTeam = selectedTeams.some((team) => a.teamsList.includes(team))
      const bOnTeam = selectedTeams.some((team) => b.teamsList.includes(team))

      if (aOnTeam && !bOnTeam) return -1
      if (!aOnTeam && bOnTeam) return 1
      return 0
    })

    return sortedList
  }, [userList, selectedTeams])

  // filter users by team if showTeamUsersOnly is true
  let filteredUserList = useMemo(() => {
    let filteredUsers = userList

    if (showTeamUsersOnly) {
      filteredUsers = filteredUsers.filter((user) => selectedTeams.some((team) => user.teams[team]))
    }

    return filteredUsers
  }, [showTeamUsersOnly, userList, selectedTeams])

  const searchableFields = ['name', 'attrib.fullName', 'teamsList', 'rolesList', 'leader']
  // filter users using search
  const [search, setSearch, searchedUsers] = useSearchFilter(
    searchableFields,
    filteredUserList,
    'users',
  )

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

  // only show selected users in the user details panel
  const selectedUsersArray = useMemo(() => {
    return userList.filter((user) => selectedUsers.includes(user.name))
  }, [userList, selectedUsers])

  // HANDLERS

  // UPDATE TEAMS (MULTIPLE) 2
  const handleUpdateTeams = async (teams = [], config = {}) => {
    // const { noToast = false, noOpt = false, noInvalidate = false } = config || {}
    // filter out duplicate team names
    teams = teams.filter((team, index, self) => {
      return index === self.findIndex((t) => t.name === team.name)
    })

    try {
      await updateTeams({
        projectName,
        teams,
        ...config,
      }).unwrap()
    } catch (error) {
      console.error(error)
    }
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

    try {
      await handleUpdateTeams([team], config)
      // Success
      setCreateTeamOpen(false)
      setSelectedTeams([name])
      !noToast && toast.success(`Created ${name}`)
    } catch (error) {
      toast.error(`Failed to create ${name}`)
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
    if (oldName === newName || !newName) return

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
      await handleNewTeam(newTeam, { noToast: true, noOpt: true, noInvalidate: true })
      // then delete old team
      await handleDeleteTeams([oldName], { noToast: true, noOpt: true })

      toast.success(`Renamed team: ${oldName} to ${newName}`)
    } catch {
      toast.error(`Unable to rename team: ${oldName}`)
    }
    setIsUpdating(false)
  }

  const toastId = useRef(null)
  // DELETE TEAM
  const onDelete = async () => {
    confirmDelete({
      label: `${selectedTeams.length} team(s)`,
      accept: async () => await handleDeleteTeams(selectedTeams),
      showToasts: false,
    })
  }

  // check if duplicate team name is valid
  const isDuplicateTeamNameValid = useMemo(() => {
    return (
      duplicateTeamName &&
      !teams.some((team) => team.name.toLowerCase() === duplicateTeamName.toLowerCase())
    )
  }, [duplicateTeamName, teams])

  // DUPLICATE TEAM
  const onDuplicate = async (e, name) => {
    e.preventDefault()

    // get selected team
    const selectedTeam = teams.find((team) => team.name === selectedTeams[0])

    if (!selectedTeam) return

    // copy selected team with new name
    const newTeam = {
      name,
      members: selectedTeam.members,
    }

    // create new team
    handleNewTeam(newTeam)

    // create new team with same users
    setDuplicateTeamNameVisible(false)
    setDuplicateTeamName('')
  }

  const onCancelDuplicate = () => {
    setDuplicateTeamNameVisible(false)
    setDuplicateTeamName('')
  }

  const isLoading = isLoadingUsers || isLoadingTeams || isUpdating

  return (
    <>
      <Dialog
        isOpen={duplicateTeamNameVisible}
        onClose={onCancelDuplicate}
        header={<span>Duplicate Team - {selectedTeams[0]}</span>}
        style={{ minWidth: 300 }}
        size="sm"
      >
        <form onSubmit={(e) => onDuplicate(e, duplicateTeamName)}>
          <InputText
            id="name"
            value={duplicateTeamName}
            onChange={(e) => setDuplicateTeamName(e.target.value)}
            autoFocus
            placeholder="New team name..."
            style={{ width: '100%' }}
          />
          <span style={{ height: 18, display: 'block' }}>
            {duplicateTeamName && !isDuplicateTeamNameValid && 'Team name already taken'}
          </span>
          <SaveButton
            label="Create"
            type="submit"
            active={!!isDuplicateTeamNameValid}
            style={{
              marginLeft: 'auto',
            }}
          />
        </form>
      </Dialog>
      <ProjectManagerPageLayout
        projectList={projectList}
        toolbar={
          <>
            {!isUser && (
              <>
                <Button
                  icon={'group_add'}
                  label="Add New Team"
                  onClick={() => setCreateTeamOpen(true)}
                  style={{ width: 200 }}
                />
                <InputText
                  style={{ width: '200px' }}
                  placeholder="Filter users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoComplete="off"
                />
                <InputSwitch
                  checked={showTeamUsersOnly}
                  onChange={() => setShowTeamUsersOnly(!showTeamUsersOnly)}
                />
                Hide Other Team Members
                <Spacer />
              </>
            )}
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
            onDuplicate={() => setDuplicateTeamNameVisible(true)}
            onNewTeam={() => setCreateTeamOpen(true)}
          />
          <UserListTeams
            selectedProjects={[projectName]}
            selectedUsers={selectedUsers}
            onSelectUsers={(users) => setSelectedUsers(users)}
            userList={searchedUsers}
            isLoading={isLoading}
            selectedTeams={selectedTeams}
            onShowAllUsers={() => setShowTeamUsersOnly(!showTeamUsersOnly)}
            showAllUsers={showTeamUsersOnly}
            teams={teams}
            onUpdateTeams={(teams) => handleUpdateTeams(teams, { noInvalidate: true })}
          />
          {!isUser && (
            <SectionStyled>
              <TeamUsersDetails
                users={selectedUsersArray}
                teams={teams}
                selectedTeams={selectedTeams}
                rolesList={rolesList}
                onUpdateTeams={(teams) => handleUpdateTeams(teams, { noInvalidate: true })}
                isFetching={isUpdating || isLoading}
              />
              <TeamDetails
                teams={teams}
                selectedTeams={selectedTeams}
                onUpdateTeams={(teams) => handleUpdateTeams(teams, { noInvalidate: true })}
                roles={selectedTeamsRoles}
                onRenameTeam={(v) => handleRenameTeam(selectedTeams[0], v)}
              />
            </SectionStyled>
          )}
          {createTeamOpen && (
            <CreateNewTeam
              onClose={() => setCreateTeamOpen(false)}
              users={filteredUserList}
              {...{ projectName, selectedTeams, isLoading, rolesList }}
              onCreate={handleNewTeam}
              isUpdating={isUpdatingTeams}
            />
          )}
        </Section>
      </ProjectManagerPageLayout>
    </>
  )
}

export default TeamsPage

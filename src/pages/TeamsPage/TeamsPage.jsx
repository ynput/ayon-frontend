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

const TeamsPage = ({ projectName, projectList, toolbar, isUser }) => {
  // STATES
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showTeamUsersOnly, setShowTeamUsersOnly] = useState(false)

  // RTK QUERY HOOKS
  const { data: teams = [], isLoading } = useGetTeamsQuery(
    { projectName, showMembers: true },
    { skip: !projectName },
  )

  let { data: users = [], isLoading: isLoadingUsers } = useGetUsersQuery(
    {},
    { skip: !projectName || isUser },
  )

  // const [getUser] = useLazyGetUserQuery()

  // const getUsersForTeams = async () => {
  //   const users = []
  //   const loadedUsers = []
  //   teams.forEach(async (team) => {
  //     await (async () => {
  //       for (const member of team.members) {
  //         if (!loadedUsers.find((user) => user === member.name)) {
  //           try {
  //             const res = await getUser({ name: member.name }).unwrap()
  //             users.push(res)
  //             loadedUsers.push(member.name)
  //           } catch (error) {
  //             // do nothing
  //           }
  //         }
  //       }
  //     })()
  //   })

  //   setUsers(users)
  //   setIsLoadingUsers(false)
  // }
  // console.log(users)

  // // for each team, get the users
  // useEffect(() => {
  //   if (!isLoading && teams.length) getUsersForTeams()
  // }, [teams, isLoading])

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

  // only show selected users in the user details panel
  const selectedUsersArray = useMemo(() => {
    return userList.filter((user) => selectedUsers.includes(user.name))
  }, [userList, selectedUsers])

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
          isLoading={isLoading}
          multiselect
          onSelect={(teams) => setSelectedTeams(teams)}
          styleSection={{ height: '100%', flex: 0.4 }}
        />
        <UserListTeams
          selectedProjects={[projectName]}
          selectedUsers={selectedUsers}
          onSelectUsers={(users) => setSelectedUsers(users)}
          userList={userList}
          isLoading={isLoadingUsers}
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
          />
          <TeamDetails teams={teams} selectedTeams={selectedTeams} />
        </Section>
      </Section>
    </ProjectManagerPageLayout>
  )
}

export default TeamsPage

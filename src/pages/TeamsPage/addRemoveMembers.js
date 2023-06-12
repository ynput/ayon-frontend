// for the provided users and teams, add/remove the selected users to/from the selected teams

const addRemoveMembers = (teams, userNames = [], addedTeams, removedTeams) => {
  // add/remove all users to teams
  const updatedTeamsWithNewMembers = []
  teams.forEach((team) => {
    // remove out the selected users from the team
    const membersWithRemovedUsers = team.members.filter(
      (member) => !userNames.includes(member.name),
    )

    if (addedTeams.includes(team.name)) {
      // create new users array with updated roles and leader
      // if user is already on team, keep their roles and leader
      const newUsersToAdd = userNames.map((user) => ({
        name: user,
        leader: false,
        roles: [],
      }))

      // now merge new users with existing team members
      const newMembers = [...membersWithRemovedUsers, ...newUsersToAdd]

      // add selected members to new team
      updatedTeamsWithNewMembers.push({
        name: team.name,
        members: newMembers,
      })
    } else if (removedTeams.includes(team.name)) {
      // remove members from team
      updatedTeamsWithNewMembers.push({
        name: team.name,
        members: membersWithRemovedUsers,
      })
    }
  })

  return updatedTeamsWithNewMembers
}

export default addRemoveMembers

type ProjectUsersResponse = {
    [key: string]: string[]
}

type AccessGroupUsers = {
  [key: string]: string[]
}

const getAllProjectUsers = (groupedUsers: AccessGroupUsers): string[]  => {
  let allUsers: string[] = []
  for (const [_, users] of Object.entries(groupedUsers)) {
    allUsers.push(...users)
  }

  return [...new Set(allUsers)]
}

const mapUsersByAccessGroups = (response: ProjectUsersResponse | undefined): AccessGroupUsers => {
  if (!response) {
    return {}
  }

  const groupedUsers: { [key: string]: string[] } = {}
  for (const [user, acessGroupsList] of Object.entries(response)) {
    console.log(user)
    for (const accessGroup of acessGroupsList) {
      if (groupedUsers[accessGroup] === undefined) {
        groupedUsers[accessGroup] = []
      }
      if (groupedUsers[accessGroup].includes(user)) {
        continue
      }
      groupedUsers[accessGroup].push(user)
    }
  }

  return groupedUsers
}

export { mapUsersByAccessGroups, getAllProjectUsers }

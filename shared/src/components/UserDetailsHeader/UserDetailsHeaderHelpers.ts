/** What the user details header needs of a user; the rest is shown in "View data". */
export interface UserDetailsHeaderUser {
  name?: string
  self?: boolean
  attrib?: { fullName?: string | null } | null
  accessGroups?: Record<string, unknown>
  isAdmin?: boolean
  isManager?: boolean
  isService?: boolean
}

/**
 * The users' access as the user details header's subtitle shows it: their access groups, or
 * admin, manager or service instead of them.
 */
export const usersAccessLabel = (users: UserDetailsHeaderUser[]) => {
  const access = users.reduce<string[]>((acc, user) => {
    let groups = Object.keys(user.accessGroups || {})
    // an admin is also a manager; named like the access level control
    if (user.isManager && !user.isAdmin) groups = ['Manager']
    if (user.isManager && user.isAdmin) groups = ['Admin']
    if (user.isService) groups = ['Service']
    return [...new Set([...acc, ...groups])]
  }, [])
  return access.length ? access.join(', ') : 'No access groups'
}

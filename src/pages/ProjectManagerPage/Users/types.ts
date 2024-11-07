export type ProjectUsersResponse = {
    [key: string]: string[]
}

export type AccessGroupUsers = {
  [key: string]: string[]
}

export type SelectedAccessGroupUsers = {
  accessGroup: string
  users: string[]
}

export type AccessGroupUsers = {
  [key: string]: string[]
}

export type SelectedAccessGroupUsers = {
  accessGroup?: string
  users: string[]
}


export enum SelectionStatus {
  None = 'none',
  Mixed = 'mixed',
  All = 'all',
}
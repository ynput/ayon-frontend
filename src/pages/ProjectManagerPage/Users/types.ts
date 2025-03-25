export type AccessGroupUsers = {
  [key: string]: string[]
}

export type HoveredUser = {
  accessGroup?: string
  user?: string
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
export type ListingError = {
  icon: string
  message: string
  details?: string
}
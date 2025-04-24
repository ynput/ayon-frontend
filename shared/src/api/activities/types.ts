import { GetKanbanProjectUsersQuery } from '@graphql'

type AccessGroups = {
  [key: string]: string[]
}

export type ProjectUser = Omit<
  GetKanbanProjectUsersQuery['users']['edges'][0]['node'],
  'accessGroups'
> & { accessGroups: AccessGroups; projects: string[]; avatarUrl: string }

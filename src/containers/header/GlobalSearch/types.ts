export type GlobalSearchEntityType = 'folder' | 'task' | 'product' | 'version'

export type GlobalSearchResult = {
  id: string
  projectName: string
  entityType: GlobalSearchEntityType
  targetEntityType?: GlobalSearchEntityType
  targetEntityId?: string
  name: string
  label: string
  parents: string[]
  subType?: string
  icon: string
  iconColor?: string
  thumbnailId?: string
  thumbnailUrl?: string
  pathLabel: string
  uri: string
  targetUrl: string
  score: number
}

export type UseGlobalProjectSearchArgs = {
  projectName?: string
  search: string
  limit?: number
}

export type UseGlobalProjectSearchResult = {
  results: GlobalSearchResult[]
  isLoading: boolean
  isFetching: boolean
}

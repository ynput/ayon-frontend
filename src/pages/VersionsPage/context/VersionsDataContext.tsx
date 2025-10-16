import { useGetVersionsByProductsQuery, useGetVersionsInfiniteQuery } from '@shared/api'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { VersionNode } from '@shared/api/queries'
import { flattenInfiniteVersionsData } from '@shared/api/queries/versions/versionsUtils'
import { createContext, FC, ReactNode, useContext, useMemo, useState } from 'react'
import { buildAllVersionsMaps, VersionNodeExtended } from '../util'
import { useBuildVersionsTableData } from '../hooks'
import { TableRow, useExpandedState } from '@shared/containers'
import { ExpandedState, OnChangeFn } from '@tanstack/react-table'

export type VersionMap = Map<string, VersionNodeExtended>

interface VersionsDataContextValue {
  // STACKED
  isStacked: boolean
  setIsStacked: (stacked: boolean) => void
  //   EXPANDED
  expanded: ExpandedState
  setExpanded: (expanded: ExpandedState) => void
  updateExpanded: OnChangeFn<ExpandedState>
  //   FILTERS
  filter: QueryFilter
  setFilter: (filter: QueryFilter) => void
  // data
  versions: VersionNode[]
  childVersions: VersionNode[]
  versionsTableData: TableRow[]
  versionsMap: VersionMap // all versions, including children
  hasNextPage: boolean | undefined
  fetchNextPage: () => void
  isFetchingNextPage: boolean
}

const VersionsDataContext = createContext<VersionsDataContextValue | null>(null)

export const useVersionsDataContext = () => {
  const context = useContext(VersionsDataContext)
  if (!context) {
    throw new Error('useVersionsDataContext must be used within VersionsDataProvider')
  }
  return context
}

interface VersionsDataProviderProps {
  projectName: string
  children: ReactNode
}

export const VersionsDataProvider: FC<VersionsDataProviderProps> = ({ projectName, children }) => {
  const [isStacked, setIsStacked] = useState(false)
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [filter, setFilter] = useState<QueryFilter>({})
  const filterString = JSON.stringify(filter)

  const { updateExpanded, expandedIds } = useExpandedState({
    expanded,
    setExpanded,
  })

  const {
    currentData: versionsData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGetVersionsInfiniteQuery({ projectName, latest: isStacked, filter: filterString })

  const versions = useMemo(() => flattenInfiniteVersionsData(versionsData), [versionsData])

  const expandedVersionsProductIds = useMemo(
    () =>
      Array.from(
        new Set(versions.filter((v) => expandedIds.includes(v.id)).map((v) => v.productId)),
      ),
    [versions, expanded],
  )

  const { data: { versions: childVersions = [] } = {} } = useGetVersionsByProductsQuery({
    projectName,
    productIds: expandedVersionsProductIds,
  })

  // Efficiently build all three maps in a single pass using util
  const { rootVersionsMap, childVersionsMap, versionsMap } = useMemo(
    () => buildAllVersionsMaps(versions, childVersions),
    [versions, childVersions],
  )

  const versionsTableData = useBuildVersionsTableData({
    rootVersionsMap,
    childVersionsMap,
    isStacked,
  })

  const value: VersionsDataContextValue = {
    isStacked,
    setIsStacked,
    // filters
    filter,
    setFilter,
    // expanded
    expanded,
    setExpanded,
    updateExpanded,
    // data
    versions,
    childVersions,
    versionsTableData,
    versionsMap,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  }

  return <VersionsDataContext.Provider value={value}>{children}</VersionsDataContext.Provider>
}

import { useGetEntitiesByIdsQuery, useGetFilteredEntitiesByParentQuery, useGetFilteredEntitiesQuery } from "@queries/overview/getFilteredEntities"
import { $Any } from "@types"
import { useSelector } from "react-redux"
import { ExpandedState } from "@tanstack/react-table"
import { useGetFolderListQuery } from "@queries/getHierarchy"
import { Filter } from "@components/SearchFilter/types"
import { mapQueryFilters } from "./mappers"

  const useFilteredEntities = ({
    filters,
    sliceFilter,
    rowSelection,
    expanded,
  }: {
    filters: Filter[]
    sliceFilter: $Any
    rowSelection: { [key: string]: boolean }
    expanded: ExpandedState
  }) => {
  const projectName = useSelector((state: $Any) => state.project.name)
  const queryFilters = mapQueryFilters({ filters, sliceFilter })

  const { data: { folders = [] } = {} } = useGetFolderListQuery(
    { projectName: projectName || '' },
    { skip: !projectName },
  )

  let folderIds: string[] = []
    if (Object.keys(rowSelection).length == 0) {
      // Falling back to root nodes when no sidebar selection in place
      folderIds = folders.filter(el => el.parentId === null).map(el => el.id)
    } else {
      folderIds = Object.keys(rowSelection)
    }

    const selectedRowsEntities = useGetEntitiesByIdsQuery({
      projectName,
      folderIds: folderIds
    })

    /*
    const entities = useGetFilteredEntitiesByParentQuery({
      projectName,
      parentIds: [...Object.keys(expanded), ...folderIds],
      ...queryFilters,
    })
      */

    const entities = useGetFilteredEntitiesQuery({
      projectName,
      // parentFolderIds: Object.keys(expanded).length > 0 ? Object.keys(expanded) : undefined,
      // parentFolderIds: [...Object.keys(expanded), ...folderIds],
      // folderIds: folderIds,
      // ...queryFilters,
    })

    // @ts-ignore
    const matchingFolderIds = Object.values(entities.data?.folders || {}).map(el => el.id)

    //@ts-ignore
    // doesn't make sense, ignoring filter for now, selected row results can't be filtered by next query
    const filteredRowFolders = Object.values(selectedRowsEntities.data?.folders || []).filter(
      (el) => {
        return true
        return matchingFolderIds.includes(el.id)
      },
    )

    const filteredRowTasks = Object.values(selectedRowsEntities.data?.tasks || []).filter(el => {
      return true
      return matchingFolderIds.includes(el.id)
    })

    return {
      folders: {
        ...entities.data?.folders,
        ...filteredRowFolders.reduce((acc, curr) => ({ ...acc, [curr.id as string]: curr }), {}),
      },
      tasks: {
        ...entities.data?.tasks,
        ...filteredRowTasks,
      },
    }
  }

  export default useFilteredEntities
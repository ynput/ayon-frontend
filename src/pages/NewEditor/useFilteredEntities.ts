import { useGetEntitiesByIdsQuery, useGetFilteredEntitiesByParentQuery } from "@queries/overview/getFilteredEntities"
import { $Any } from "@types"
import { useSelector } from "react-redux"
import { ExpandedState } from "@tanstack/react-table"

  const useFilteredEntities = ({
    rowSelection,
    expanded,
  }: {
    rowSelection: { [key: string]: boolean }
    expanded: ExpandedState
  }) => {
    const projectName = useSelector((state: $Any) => state.project.name)

    const selectedRowsEntities = useGetEntitiesByIdsQuery({
      projectName,
      folderIds: Object.keys(rowSelection) || [],
    })

    const entitiesByParentId = useGetFilteredEntitiesByParentQuery({
      projectName,
      parentIds: Object.keys(expanded) || [],
    })
    console.log('ebpi', entitiesByParentId)

    return {
      folders: {
        ...entitiesByParentId.data?.folders,
        ...selectedRowsEntities.data?.folders,
      },
      tasks: {
        ...entitiesByParentId.data?.tasks,
        ...selectedRowsEntities.data?.tasks,
      },
    }
  }

  export default useFilteredEntities
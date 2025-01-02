import { useGetEntitiesByIdsQuery, useGetFilteredEntitiesByParentQuery } from "@queries/overview/getFilteredEntities"
import { $Any } from "@types"
import { useSelector } from "react-redux"
import { ExpandedState } from "@tanstack/react-table"
import { useGetFolderListQuery } from "@queries/getHierarchy"

  const useFilteredEntities = ({
    rowSelection,
    expanded,
  }: {
    rowSelection: { [key: string]: boolean }
    expanded: ExpandedState
  }) => {
    const projectName = useSelector((state: $Any) => state.project.name)

  const {
    data: { folders = [] } = {},
  } = useGetFolderListQuery({ projectName: projectName || '' }, { skip: !projectName })

  let folderIds: string[] = []
    if (Object.keys(rowSelection).length == 0) {
      folderIds = folders.filter(el => el.parentId === null).map(el => el.id)
    } else {
      folderIds = Object.keys(rowSelection)
    }

    const selectedRowsEntities = useGetEntitiesByIdsQuery({
      projectName,
      folderIds: folderIds
    })

    const entitiesByParentId = useGetFilteredEntitiesByParentQuery({
      projectName,
      parentIds: Object.keys(expanded) || [],
    })

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
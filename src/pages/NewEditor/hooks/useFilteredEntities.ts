import { useGetFilteredEntitiesByParentQuery } from "@queries/overview/getFilteredEntities"
import { ExpandedState } from "@tanstack/react-table"
import { FolderListItem } from "@api/rest/folders"

  const useFilteredEntities = ({
    projectName,
    folders,
    // filters,
    // sliceFilter,
    rowSelection,
    expanded,
  }: {
    projectName: string,
    folders: FolderListItem[]
    // filters: Filter[]
    // sliceFilter: $Any
    rowSelection: { [key: string]: boolean }
    expanded: ExpandedState
  }) => {

  let folderIds: string[] = []
    if (Object.keys(rowSelection).length == 0) {
      // Falling back to root nodes when no sidebar selection in place
      folderIds = folders.filter(el => el.parentId === null).map(el => el.id)
    } else {
      folderIds = Object.keys(rowSelection)
    }


    const entities = useGetFilteredEntitiesByParentQuery({
      projectName,
      parentIds: [...Object.keys(expanded), ...folderIds],
    })

    return {
      folders: {
        ...folders.reduce((acc, curr) => ({ ...acc, [curr.id as string]: curr }), {}),
      },
      tasks: {
        ...entities.data?.tasks,
      },
    }
  }

  export default useFilteredEntities
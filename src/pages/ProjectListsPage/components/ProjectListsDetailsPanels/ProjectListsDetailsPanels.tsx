import { useListsContext } from "@pages/ProjectListsPage/context"
import { useListItemsDataContext } from "@pages/ProjectListsPage/context/ListItemsDataContext"
import ProjectOverviewDetailsPanel from "@pages/ProjectOverviewPage/containers/ProjectOverviewDetailsPanel"
import {
  getCellId,
  isEntityRestricted,
  ROW_SELECTION_COLUMN_ID,
  useDetailsPanelEntityContext,
  useProjectTableContext,
  useSelectedRowsContext,
  useSelectionCellsContext,
} from "@shared/containers"
import { useProjectContext } from "@shared/context"
import { useEffect, useMemo, useState } from "react"
import ListDetailsPanel from "../ListDetailsPanel/ListDetailsPanel"
import useReviewSessionCardsModules from "@pages/ProjectListsPage/hooks/useReviewSessionCardsModules"
import { ReviewPageView } from "@pages/ProjectListsPage/ProjectListsPage"

type Props = {
  isReview: boolean
  view: ReviewPageView
}

export default function ProjectListsDetailsPanels({ isReview, view }: Props) {
  const { projectName, ...projectInfo } = useProjectContext()
  const { getEntityById } = useProjectTableContext()
  const { selectedList, listDetailsOpen } = useListsContext()
  const { selectedRows } = useSelectedRowsContext()
  const { setSelectedCells } = useSelectionCellsContext()
  const {
    listItemsData,
    isLoadingAll: isLoadingListItems,
    listItemsFilters,
    setListItemsFilters,
  } = useListItemsDataContext()

  // Handle URI opening to select list item
  // We use state and effect because the uri callback can be called before data is loaded
  const [uriEntityId, setUriEntityId] = useState<null | string>(null)
  useEffect(() => {
    if (!uriEntityId) return

    // if there are filters, we need to remove them first
    if (listItemsFilters.conditions?.length) {
      setListItemsFilters({})
      return
      // now the list items data will reload without filters, and the effect will run again
    }

    if (isLoadingListItems || !listItemsData.length) return

    setUriEntityId(null)
    console.debug('URI found, navigating to list item:', uriEntityId)

    // find the list item by entity id
    const listItem = listItemsData.find((item) => item.entityId === uriEntityId)
    if (!listItem) {
      console.warn('List item not found for entity ID:', uriEntityId)
      return
    }

    // select the list item in the table
    // Select the entity in the table
    setSelectedCells(
      new Set([getCellId(listItem.id, 'name'), getCellId(listItem.id, ROW_SELECTION_COLUMN_ID)]),
    )
  }, [uriEntityId, isLoadingListItems, listItemsData, listItemsFilters])

  // Try to get the entity context, but it might not exist
  let selectedEntity: { entityId: string; entityType: 'folder' | 'task' } | null
  const entityContext = useDetailsPanelEntityContext()
  try {
    selectedEntity = entityContext.selectedEntity
  } catch {
    // Context not available, that's fine
    selectedEntity = null
  }

  // Check if any selected rows are restricted entities
  const hasNonRestrictedSelectedRows = selectedRows.some((rowId) => {
    const entity = getEntityById(rowId)
    return entity && !isEntityRestricted(entity.entityType)
  })

  // Check if we should show the details panel
  // Don't show entity details panel if only selected entity is restricted
  const shouldShowEntityDetailsPanel =
    (selectedRows.length > 0 || selectedEntity !== null) && hasNonRestrictedSelectedRows
  const shouldShowListDetailsPanel = listDetailsOpen && !!selectedList

  const {
    useReviewSessionCards
  } = useReviewSessionCardsModules({ skip: !isReview })

  const { clearHighlighted } = useReviewSessionCards()

  // For review session lists, closing the details panel
  // should clear the state in the addon component,
  // rather than the table.
  const overrideHandleClose = useMemo(() => {
    if (!clearHighlighted || view !== "cards") return

    return () => {
      clearHighlighted()
    }
  }, [clearHighlighted, view])

  return (
    <>
      <ProjectOverviewDetailsPanel
        projectInfo={projectInfo}
        projectName={projectName}
        isOpen={shouldShowEntityDetailsPanel}
        onUriOpen={(entity) => setUriEntityId(entity.id)}
        overrideHandleClose={overrideHandleClose}
      />
      {selectedList &&
        !shouldShowEntityDetailsPanel &&
        shouldShowListDetailsPanel && (
          <ListDetailsPanel listId={selectedList.id} projectName={projectName} />
        )}
    </>
  )
}

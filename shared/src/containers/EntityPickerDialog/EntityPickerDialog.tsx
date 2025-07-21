// This components lets you pick a specific entity from the tree table.
// Each entity type has it's own table

import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { FC, useState } from 'react'
import { entityHierarchies } from './util'
import EntityTypeTable from './components/EntityTypeTable'
import { SimpleTableProvider } from '@shared/SimpleTable'
import { Dialog, DialogProps } from '@ynput/ayon-react-components'
import { useGetProjectQuery } from '@shared/api'
import { useHierarchyTable } from '@shared/hooks'
import styled from 'styled-components'

const TablesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--base-gap-large);
  height: 100%;
  overflow: hidden;
  flex: 1;

  table {
    height: 100%;

    td:has(.path) {
      .value {
        font-weight: bold;
      }
    }
  }
`

export type PickerEntityType =
  | 'folder'
  | 'task'
  | 'product'
  | 'version'
  | 'representation'
  | 'workfile'
export type PickerSelection = Record<PickerEntityType, RowSelectionState>
export type PickerSearch = Record<PickerEntityType, string | undefined>

interface EntityPickerDialogProps extends Pick<DialogProps, 'onClose'> {
  projectName: string // The name of the project
  entityType: PickerEntityType // The type of entity to pick
  isMultiSelect?: boolean // Whether to allow multiple selection
}

export const EntityPickerDialog: FC<EntityPickerDialogProps> = ({
  projectName,
  entityType,
  isMultiSelect,
  ...props
}) => {
  // Get project data
  const { data: project } = useGetProjectQuery({ projectName })
  // convert flat list to table rows for the table
  const { data: foldersTableData, isFetching: isLoadingFolders } = useHierarchyTable({
    projectName,
    folderTypes: project?.folderTypes || [],
  })

  const [rowSelection, setRowSelection] = useState<PickerSelection>({
    folder: {},
    task: {},
    product: {},
    version: {},
    representation: {},
    workfile: {},
  })

  // helper function to set the row selection for each entity type
  const setEntityRowSelection = (selection: RowSelectionState, entityType: PickerEntityType) => {
    setRowSelection((prev) => ({
      ...prev,
      [entityType]: selection,
    }))
  }

  // convert row selection into a list of ids for each entity type to make it easier to work with
  const idSelection = Object.fromEntries(
    Object.entries(rowSelection).map(([key, value]) => [
      key,
      Object.keys(value).filter((id) => value[id]),
    ]),
  )

  const [search, setSearch] = useState<PickerSearch>({
    folder: undefined,
    task: undefined,
    product: undefined,
    version: undefined,
    representation: undefined,
    workfile: undefined,
  })

  // helper function to set the search for each entity type
  const setEntitySearch = (searchValue: string | undefined, entityType: PickerEntityType) => {
    setSearch((prev) => ({
      ...prev,
      [entityType]: searchValue || '',
    }))
  }

  // the expanded state of the folders tree table
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Get the complete hierarchy for the target entity type - much simpler!
  const entityHierarchy = entityHierarchies[entityType]

  // Function to get parent IDs for a specific entity type in the hierarchy
  const getParentIdsForEntityType = (currentEntityType: PickerEntityType): string[] | undefined => {
    const currentIndex = entityHierarchy.indexOf(currentEntityType)
    if (currentIndex === 0) {
      // This is the root entity, no parent IDs needed
      return undefined
    }

    const parentEntityType = entityHierarchy[currentIndex - 1]
    const parentIds = idSelection[parentEntityType]

    // Return parent IDs only if there are selections
    return parentIds && parentIds.length > 0 ? parentIds : undefined
  }

  //   based on the entity type, we need to create a new table for each parent
  return (
    <Dialog {...props} isOpen size="full" style={{ height: '80vh' }}>
      <TablesContainer>
        {entityHierarchy.map((tableEntityType) => (
          <SimpleTableProvider
            rowSelection={rowSelection[tableEntityType] || {}}
            onRowSelectionChange={(s) => setEntityRowSelection(s, tableEntityType)}
            // expanded state is only used for folders, so we only pass it when the entity type is folder
            expanded={tableEntityType === 'folder' ? expanded : undefined}
            setExpanded={tableEntityType === 'folder' ? setExpanded : undefined}
            key={tableEntityType}
          >
            <EntityTypeTable
              key={tableEntityType}
              foldersTableData={foldersTableData}
              isLoadingFolders={isLoadingFolders}
              projectName={projectName}
              entityType={tableEntityType}
              parentIds={getParentIdsForEntityType(tableEntityType)}
              search={search[tableEntityType]}
              onSearch={(v) => setEntitySearch(v, tableEntityType)}
            />
          </SimpleTableProvider>
        ))}
      </TablesContainer>
    </Dialog>
  )
}

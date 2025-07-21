// This components lets you pick a specific entity from the tree table.
// Each entity type has it's own table

import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { FC, useState, useMemo } from 'react'
import { entityHierarchies } from './util'
import EntityTypeTable from './components/EntityTypeTable'
import { SimpleTableProvider } from '@shared/SimpleTable'
import { Dialog, DialogProps } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { useGetEntityPickerData } from './hooks/useGetEntityPickerData'
import { upperFirst } from 'lodash'

const COL_MAX_WIDTH = 600

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
      [entityType]: searchValue,
    }))
  }

  // the expanded state of the folders tree table
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const entityData = useGetEntityPickerData({
    entityType,
    projectName,
    search,
    selection: rowSelection,
  })

  // Get data for each entity type (skip if not required)

  // Get the complete hierarchy for the target entity type - much simpler!
  const entityHierarchy = entityHierarchies[entityType]

  //   based on the entity type, we need to create a new table for each parent
  return (
    <Dialog
      {...props}
      header={`Select ${upperFirst(entityType)}`}
      isOpen
      size="full"
      style={{ height: '80vh', maxWidth: entityHierarchy.length * COL_MAX_WIDTH }}
    >
      <TablesContainer>
        {entityHierarchy.map((tableEntityType, index) => (
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
              entityType={tableEntityType}
              search={search[tableEntityType]}
              tableData={entityData[tableEntityType]?.table || []}
              isFolderHierarchy={tableEntityType === 'folder' && !search.folder}
              onSearch={(v) => setEntitySearch(v, tableEntityType)}
            />
          </SimpleTableProvider>
        ))}
      </TablesContainer>
    </Dialog>
  )
}

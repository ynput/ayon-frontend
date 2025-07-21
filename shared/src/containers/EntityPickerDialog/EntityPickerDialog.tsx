// This components lets you pick a specific entity from the tree table.
// Each entity type has it's own table

import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { FC, useState } from 'react'
import { entityHierarchies } from './util'
import EntityTypeTable from './components/EntityTypeTable'
import { SimpleTableProvider } from '@shared/SimpleTable'
import { Button, Dialog, DialogProps } from '@ynput/ayon-react-components'
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
  onSubmit: (selection: string[]) => void // Callback when the user selects an entity/entities
}

export const EntityPickerDialog: FC<EntityPickerDialogProps> = ({
  projectName,
  entityType,
  isMultiSelect,
  onSubmit,
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

  // convert row selection into a list of ids for each entity type to make it easier to work with
  const entitySelection = Object.fromEntries(
    Object.entries(rowSelection).map(([type, selection]) => [
      type,
      Object.keys(selection).filter((id) => selection[id]),
    ]),
  ) as Record<PickerEntityType, string[]>

  // the expanded state of the folders tree table
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const entityData = useGetEntityPickerData({
    entityType,
    projectName,
    search,
    selection: entitySelection,
  })

  // Get the complete hierarchy for the target entity type!
  const entityHierarchy = entityHierarchies[entityType]

  const handleSubmit = () => {
    // check the target entity has a selection
    if (!entitySelection[entityType]?.length) {
      return
    }
    const selection = isMultiSelect
      ? entitySelection[entityType]
      : entitySelection[entityType].slice(0, 1)
    // Call the onSubmit callback with the selected entity ids
    onSubmit(selection)
  }

  //   based on the entity type, we need to create a new table for each parent
  return (
    <Dialog
      {...props}
      header={`Select ${upperFirst(entityType)}`}
      isOpen
      size="full"
      style={{ height: '80vh', maxWidth: entityHierarchy.length * COL_MAX_WIDTH }}
      footer={
        <Button
          label={`Select ${entityType}${isMultiSelect ? 's' : ''}`}
          variant="filled"
          disabled={!entitySelection[entityType]?.length}
          onClick={handleSubmit}
        />
      }
    >
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
              entityType={tableEntityType}
              search={search[tableEntityType]}
              tableData={entityData[tableEntityType]?.table || []}
              isFolderHierarchy={tableEntityType === 'folder' && !search.folder}
              onSearch={(v) => setEntitySearch(v, tableEntityType)}
              isMultiSelect={tableEntityType === entityType ? !!isMultiSelect : true}
            />
          </SimpleTableProvider>
        ))}
      </TablesContainer>
    </Dialog>
  )
}

import { toast } from 'react-toastify'
import { useState, useMemo, useEffect } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import {
  TablePanel,
  Button,
  Section,
  Toolbar,
  Spacer,
  SaveButton,
} from '@ynput/ayon-react-components'
import SearchInput from '@components/SearchInput'
import { AttributeEditor, BooleanValue, getUiTypeLabel } from '@shared/components'
import { formatDateTime } from '@shared/util'
import { useGetAttributeListQuery, useSetAttributeListMutation } from '@shared/api'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import useSearchFilter from '@hooks/useSearchFilter'
import { isEqual } from 'lodash'
import clsx from 'clsx'
import styled from 'styled-components'
import useTableLoadingData from '@hooks/useTableLoadingData'

// the drag handles stay in the background until their row is hovered
const StyledDataTable = styled(DataTable)`
  .p-datatable-reorderablerow-handle {
    color: var(--md-sys-color-outline);
  }
  tr:hover .p-datatable-reorderablerow-handle {
    color: var(--md-sys-color-on-surface);
  }
`

// Validation errors point at an index (loc: ['body', 'attributes', 44, 'name']), not a name
const getSaveErrorReason = (err, attributes) => {
  const invalid = err?.data?.errors?.find((e) => e.loc?.[1] === 'attributes')
  if (!invalid) return err?.data?.detail
  const name = attributes[invalid.loc[2]]?.name
  return `${name ? `"${name}" ` : ''}${invalid.loc[3] || ''} ${invalid.msg}`.trim()
}

const Attributes = () => {
  const [attributes, setAttributes] = useState([])
  const [selectedAttribute, setSelectedAttribute] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const { data, isLoading, isError, error, isFetching } = useGetAttributeListQuery()

  const [updateAttributes, { isLoading: updateLoading }] = useSetAttributeListMutation()

  // when new data is loaded come in update local state
  useEffect(() => {
    if (data && !updateLoading && !isFetching) {
      setAttributes(data)
    }
  }, [data, isLoading, isFetching, updateLoading])

  // check for changes
  const isChanges = useMemo(() => {
    if (!data || !attributes) return false
    return !isEqual(data, attributes)
  }, [data, attributes])

  if (isError) {
    toast.error('Unable to load attribute list')
  }

  // used to disallow adding a new attribute with existing name
  // seriously. the syntax is terrible. compare the following:
  // existingAttrNames = [attr.name for attr in attributes] if attributes else []
  const existingAttrNames = useMemo(
    () => (attributes ? attributes.map((i) => i.name) : []),
    [attributes],
  )

  const onSave = async () => {
    await updateAttributes({ setAttributeListModel: { attributes, deleteMissing: true } })
      .unwrap()
      .then(() => {
        toast.success('Attribute set saved')
      })
      .catch((err) => {
        const reason = getSaveErrorReason(err, attributes)
        toast.error(reason ? `Unable to set attributes: ${reason}` : 'Unable to set attributes')
      })
  }

  const onEdit = (attribute) => {
    const index = attributes.findIndex((v) => v.name === attribute.name)
    let newAttributes = [...attributes]
    if (index === -1) {
      // creating new attribute
      newAttributes.push(attribute)
    } else {
      // updating existing attribute
      newAttributes.splice(index, 1, attribute)
    }

    setAttributes(newAttributes)

    setSelectedAttribute(attribute)
    setShowEditor(false)
  }

  const onRowReorder = (e) => {
    const rows = e.value
    let i = 0
    for (const row of rows) {
      row.position = i
      i++
    }
    setAttributes(rows)
  }

  const onNewAttribute = () => {
    setSelectedAttribute(null)
    setShowEditor(true)
  }

  const onDelete = (selected) => {
    if (!selected?.name || Array.isArray(selected)) return
    setAttributes((attrs) => {
      return attrs.filter((attr) => attr.name !== selected.name)
    })
  }

  // for sortable fields
  let sortableAttributes = attributes.map((a) => ({ ...a, scopeLength: a?.scope.length }))

  const searchableFields = ['name', 'data.title', 'scope', 'data.type']

  const [search, setSearch, filteredData] = useSearchFilter(
    searchableFields,
    sortableAttributes,
    'attributes',
  )

  const getContextMenu = (selected) => [
    {
      label: 'Edit',
      icon: 'edit',
      // the editor opens the selected attribute
      command: () => {
        setSelectedAttribute(selected)
        setShowEditor(true)
      },
    },
    {
      label: 'Delete',
      icon: 'delete',
      command: () => onDelete(selected),
      danger: true,
      disabled: selected?.builtin,
    },
  ]

  const [ctxMenuTableShow] = useCreateContextMenu([])

  const handleContextSelectionChange = (e) => {
    ctxMenuTableShow(e.originalEvent, getContextMenu(e.value))
  }

  const tableData = useTableLoadingData(filteredData, isLoading, 30, 'name')

  return (
    <>
      <main>
        {showEditor && (
          <AttributeEditor
            attribute={selectedAttribute}
            existingNames={existingAttrNames}
            onEdit={onEdit}
            onHide={() => setShowEditor(false)}
          />
        )}
        <Section>
          <Toolbar>
            <Button label="Add attribute" icon="add" onClick={onNewAttribute} />
            <Button
              label="Delete attribute"
              icon="delete"
              disabled={!selectedAttribute || selectedAttribute.builtin}
              onClick={() => onDelete(selectedAttribute)}
            />
            <SearchInput
              style={{ width: '200px' }}
              placeholder="Filter attributes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Spacer />
            {isChanges && 'Unsaved changes'}
            <Button
              label="Clear changes"
              icon="clear"
              disabled={!isChanges}
              onClick={() => setAttributes(data)}
            />
            <SaveButton
              label="Save changes"
              onClick={onSave}
              active={isChanges}
              saving={updateLoading}
            />
          </Toolbar>
          <TablePanel loading={isLoading || updateLoading || isFetching}>
            <StyledDataTable
              scrollable="true"
              scrollHeight="flex"
              dataKey="name"
              value={tableData}
              reorderableRows
              onRowReorder={onRowReorder}
              selectionMode="single"
              selection={selectedAttribute}
              onSelectionChange={(e) => setSelectedAttribute(e.value)}
              onContextMenuSelectionChange={handleContextSelectionChange}
              onRowDoubleClick={() => !Array.isArray(selectedAttribute) && setShowEditor(true)}
              resizableColumns
              className={clsx('standard-rows', { loading: isLoading })}
              rowClassName={() => ({ loading: isLoading })}
            >
              <Column rowReorder style={{ maxWidth: 30 }} />
              <Column field="name" header="Name" style={{ maxWidth: 130 }} sortable />
              <Column field="data.title" header="Title" style={{ maxWidth: 130 }} sortable />
              <Column
                field="builtin"
                header="Origin"
                style={{ maxWidth: 90 }}
                body={(rowData) => (rowData?.builtin ? 'Built-in' : 'Custom')}
                sortable
              />
              <Column
                header="Scopes"
                field="scopeLength"
                body={(rowData) => rowData?.scope?.join(', ')}
                style={{ maxWidth: 330 }}
                sortable
              />
              <Column
                header="Type"
                style={{ maxWidth: 150 }}
                sortable
                sortField="data.type"
                body={(rowData) =>
                  getUiTypeLabel(rowData.data?.type, rowData.data?.enum, rowData.data?.enumResolver)
                }
                sortFunction={(e) => {
                  const dir = e.order ?? 1
                  return [...e.data].sort((a, b) => {
                    const la = getUiTypeLabel(a.data?.type, a.data?.enum, a.data?.enumResolver)
                    const lb = getUiTypeLabel(b.data?.type, b.data?.enum, b.data?.enumResolver)
                    return la.localeCompare(lb) * dir
                  })
                }}
              />
              <Column
                field="data.example"
                header="Example"
                style={{ maxWidth: 240 }}
                body={(rowData) =>
                  rowData.data?.type === 'datetime'
                    ? formatDateTime(rowData.data.example) || rowData.data.example
                    : rowData.data?.example
                }
                sortable
              />
              {/* takes the room that is left and cuts its text there, so the table never gets wider than the page */}
              <Column
                field="data.description"
                header="Description"
                style={{ width: '100%', maxWidth: 0 }}
                sortable
              />
              <Column
                field="data.inherit"
                header="Inherit"
                sortable
                style={{ minWidth: 96 }}
                body={(rowData) => !isLoading && <BooleanValue value={!!rowData.data?.inherit} />}
              />
            </StyledDataTable>
          </TablePanel>
        </Section>
      </main>
    </>
  )
}

export default Attributes

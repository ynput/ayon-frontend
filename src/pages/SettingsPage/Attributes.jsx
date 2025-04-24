import { toast } from 'react-toastify'
import { useState, useMemo, useEffect } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import {
  TablePanel,
  Button,
  Section,
  Toolbar,
  InputText,
  Spacer,
  SaveButton,
} from '@ynput/ayon-react-components'
import AttributeEditor from '@containers/attributes/attributeEditor'
import { useGetAttributeListQuery } from '@queries/attributes/getAttributes'
import { useSetAttributeListMutation } from '@queries/attributes/updateAttributes'
import useSearchFilter from '@hooks/useSearchFilter'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { isEqual } from 'lodash'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'

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
    console.error(error)
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
        console.error(err)
        toast.error('Unable to set attributes')
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

  const onDelete = () => {
    if (!selectedAttribute?.name || Array.isArray(selectedAttribute)) return
    setAttributes((attrs) => {
      return attrs.filter((attr) => attr.name !== selectedAttribute.name)
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
      command: () => setShowEditor(true),
    },
    {
      label: 'Delete',
      icon: 'delete',
      command: () => onDelete(),
      danger: true,
      disabled: selected?.builtin,
    },
  ]

  const [ctxMenuTableShow] = useCreateContextMenu([])

  const handleContextSelectionChange = (e) => {
    setSelectedAttribute(e.value)
    console.log(e.value)
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
            <Button label="Add Attribute" icon="add" onClick={onNewAttribute} />
            <Button
              label="Delete attribute"
              icon="delete"
              disabled={selectedAttribute?.builtin}
              onClick={onDelete}
            />
            <InputText
              style={{ width: '200px' }}
              placeholder="Filter attributes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Spacer />
            {isChanges && 'Unsaved Changes'}
            <Button
              label="Clear changes"
              icon="clear"
              disabled={!isChanges}
              onClick={() => setAttributes(data)}
            />
            <SaveButton
              label="Save attributes changes"
              onClick={onSave}
              active={isChanges}
              saving={updateLoading}
            />
          </Toolbar>
          <TablePanel loading={isLoading || updateLoading || isFetching}>
            <DataTable
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
              className={clsx({ loading: isLoading })}
              rowClassName={() => ({ loading: isLoading })}
            >
              <Column rowReorder style={{ maxWidth: 30 }} />
              <Column field="name" header="Name" style={{ maxWidth: 130 }} sortable />
              <Column field="data.title" header="Title" style={{ maxWidth: 130 }} sortable />
              <Column
                field="builtin"
                header=""
                style={{ maxWidth: 60 }}
                body={(rowData) => (rowData?.builtin ? 'built-in' : '')}
                sortable
              />
              <Column
                header="Scopes"
                field="scopeLength"
                body={(rowData) => rowData?.scope?.join(', ')}
                style={{ maxWidth: 330 }}
                sortable
              />
              <Column field="data.type" header="Type" style={{ maxWidth: 150 }} sortable />
              <Column field="data.example" header="Example" style={{ maxWidth: 200 }} sortable />
              <Column field="data.description" header="Description" sortable />
              <Column field="data.inherit" header="Inherit" sortable style={{ maxWidth: 80 }} />
            </DataTable>
          </TablePanel>
        </Section>
      </main>
    </>
  )
}

export default Attributes

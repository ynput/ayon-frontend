import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import BundleStatus from './BundleStatus/BundleStatus'
import { Button, Section, TablePanel } from '@ynput/ayon-react-components'
import useCreateContext from '@hooks/useCreateContext'
import { confirmDelete } from '@shared/helpers'
import clsx from 'clsx'

const AddonsManagerTable = ({
  title = '',
  header,
  isArchive = false,
  field = '',
  selection = [],
  value = [],
  onChange,
  onDelete,
  onDeleteSuccess,
  extraContext,
  sortFunction,
  emptyMessage,
  isLoading,
  ...props
}) => {
  const deleteLabel = isArchive ? 'Archive' : 'Uninstall'
  const deleteIcon = isArchive ? 'archive' : 'delete'
  const tableSelection = value?.filter((d) => selection.includes(d && d[field]))

  const handleDelete = async (e, selected) => {
    e?.preventDefault()

    confirmDelete({
      label: title,
      message: (
        <ul>
          {selected.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ),
      accept: async () => await onDelete(selected),
      onSuccess: () => onDeleteSuccess && onDeleteSuccess(selected),
      isArchive,
    })
  }

  const createContextItems = (selected, enabled) => {
    let items = []

    if (onDelete) {
      items.push({
        label: deleteLabel,
        icon: deleteIcon,
        disabled: !enabled,
        command: () => handleDelete(undefined, selected),
      })
    }

    if (extraContext) {
      items = items.concat(extraContext(selected))
    }

    return items
  }

  const [ctxMenuShow] = useCreateContext([])

  const handleContextClick = (e) => {
    let contextSelection = []
    // is new click not in original selection?
    if (!selection.includes(e.data[field])) {
      // then update selection to new click
      onChange([e.data[field]])
      contextSelection = [e.data[field]]
    } else {
      contextSelection = tableSelection.map((d) => d[field])
    }

    // check new selection is deletable
    const deleteEnabled =
      contextSelection.length &&
      contextSelection.every((d) => {
        const v = value.find((v) => v[field] === d)
        if (v) return !v.status.filter((s) => s !== 'error').length
        return false
      })

    ctxMenuShow(e.originalEvent, createContextItems(contextSelection, deleteEnabled))
  }

  return (
    <Section style={{ height: '100%' }}>
      {onDelete && (
        <Button
          icon={deleteIcon}
          disabled={tableSelection.some((v) => v.status?.filter((s) => s !== 'error').length)}
          onClick={(e) => handleDelete(e, selection)}
        >
          {deleteLabel} {title}
        </Button>
      )}
      {header && header}
      <TablePanel style={{ height: '100%' }}>
        <DataTable
          {...props}
          value={value}
          scrollable
          scrollHeight="flex"
          selectionMode="multiple"
          onSelectionChange={(e) => onChange(e.value?.map((d) => d && d[field]))}
          selection={tableSelection}
          onContextMenu={handleContextClick}
          emptyMessage={emptyMessage}
          className={clsx({ loading: isLoading })}
          rowClassName={() => ({ loading: isLoading })}
        >
          <Column
            field={field}
            header={title}
            sortable
            sortFunction={
              sortFunction
                ? (event) => event.data.sort((a, b) => sortFunction(event.order)(a, b))
                : null
            }
            body={(d) => (
              <span
                data-tooltip={d?.tooltip}
                data-tooltip-delay={0}
                data-tooltip-as={'pre'}
                style={{ width: '100%' }}
              >
                {d[field]} {d?.suffix}
              </span>
            )}
          />
          <Column
            field="status"
            header={'Status'}
            style={{ minWidth: 90, flex: 0 }}
            headerStyle={{ width: 50 }}
            body={(d) => <BundleStatus statuses={d.status} />}
            sortable
            sortFunction={(event) => {
              // sort by status length
              return event.data.sort((a, b) =>
                event.order === 1
                  ? b.status.length - a.status.length
                  : a.status.length - b.status.length,
              )
            }}
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default AddonsManagerTable

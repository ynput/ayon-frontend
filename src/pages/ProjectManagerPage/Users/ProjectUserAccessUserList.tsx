
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import clsx from 'clsx'
import { $Any } from '@types'
import { UserNode } from '@api/graphql'
import UserRow from './UserRow'
import { Filter } from '@components/SearchFilter/types'

type Props = {
  selectedProjects: string[]
  selectedUsers: string[]
  tableList: $Any
  filters?: Filter
  isLoading: boolean
  header?: string
  emptyMessage: string
  sortable?: boolean
  isUnassigned?: boolean
  onContextMenu?: $Any
  onSelectUsers?: (selectedUsers: string[]) => void
  onAdd: (user? : string) => void
  onRemove?: (user?: string) => void
}

const ProjectUserAccessUserList = ({
  selectedProjects,
  selectedUsers,
  tableList,
  filters,
  isLoading,
  header,
  emptyMessage,
  sortable = false,
  isUnassigned = false,
  onAdd,
  onRemove,
  onContextMenu,
  onSelectUsers,
}: Props) => {
  const onSelectionChange = (e: $Any) => {
    const result = e.value.map((user: UserNode) => user.name)

    onSelectUsers!(result)
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (selectedProjects.length === 0) {
      return
    }

    if (event.key === 'r') {
      onRemove && onRemove()
    }
    if (event.key === 'a') {
      onAdd()
    }
  }

  const selectedUnassignedUsers = tableList.filter((user: $Any) => selectedUsers.includes(user.name))
  const selectedUnassignedUserNames = selectedUnassignedUsers.map((user: $Any) => user.name)
  // Render
  return (
    <Section wrap>
      <TablePanel>
        <DataTable
          selection={selectedUnassignedUsers}
          value={tableList}
          selectionMode="multiple"
          scrollable={true}
          scrollHeight="flex"
          emptyMessage={emptyMessage}
          dataKey="name"
          className={clsx('user-list-table', { loading: isLoading })}
          rowClassName={(rowData: $Any) => clsx({ inactive: !rowData.active, loading: isLoading })}
          onContextMenu={onContextMenu}
          onKeyDown={handleKeyDown}
          onSelectionChange={(selection) => {
            return onSelectUsers && onSelectionChange(selection)
          }}
        >
          <Column
            field="name"
            header={header}
            headerStyle={{ textTransform: 'capitalize' }}
            body={(rowData) =>
              !isLoading && (
                <UserRow
                  rowData={rowData}
                  isUnassigned={isUnassigned}
                  onAdd={(user?: string) => onAdd(user)}
                  onRemove={() => {
                    onRemove && onRemove(rowData.name)
                  }}
                  showButtonsOnHover={selectedUnassignedUsers.length == 0}
                  addButtonDisabled={selectedProjects.length === 0}
                  selected={selectedUnassignedUserNames.includes(rowData.name)}
                />
              )
            }
            sortable={sortable}
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default ProjectUserAccessUserList


import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import clsx from 'clsx'
import { $Any } from '@types'
import { UserNode } from '@api/graphql'
import UserRow from './UserRow'
import { Filter } from '@components/SearchFilter/types'
import { StyledEmptyPlaceholder, StyledEmptyPlaceholderWrapper } from './ProjectUserAccess.styled'
import { HoveredUser } from './types'


type Props = {
  selectedProjects: string[]
  selectedUsers: string[]
  tableList: $Any
  accessGroup?: string
  hoveredUser?: HoveredUser
  filters?: Filter
  isLoading: boolean
  readOnly: boolean,
  header?: string
  emptyMessage: string
  sortable?: boolean
  isUnassigned?: boolean
  showAddMoreButton?: boolean
  onContextMenu?: $Any
  onHoverRow: $Any
  onSelectUsers?: (selectedUsers: string[]) => void
  onAdd: (users? : string[]) => void
  onRemove?: (users?: string[]) => void
}

const ProjectUserAccessUserList = ({
  selectedProjects,
  selectedUsers,
  tableList,
  accessGroup,
  hoveredUser,
  filters,
  isLoading,
  readOnly,
  header,
  emptyMessage,
  sortable = false,
  isUnassigned = false,
  showAddMoreButton = false,
  onAdd,
  onRemove,
  onContextMenu,
  onSelectUsers,
  onHoverRow,
}: Props) => {
  const onSelectionChange = (e: $Any) => {
    const result = e.value.map((user: UserNode) => user.name)

    onSelectUsers!(result)
  }

  const selectedUnassignedUsers = tableList.filter((user: $Any) =>
    selectedUsers.includes(user.name),
  )
  const selectedUnassignedUserNames = selectedUnassignedUsers.map((user: $Any) => user.name)
  // Render

  if (tableList.length === 0) {
    return (
      <StyledEmptyPlaceholderWrapper>
        <p className="header">{header}</p>
        <StyledEmptyPlaceholder icon="person" message="No users assigned" style={{}} />
      </StyledEmptyPlaceholderWrapper>
    )
  }

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
          onRowMouseEnter={(e) => onHoverRow(e.data.name)}
          onRowMouseLeave={() => onHoverRow()}
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
                  showAddMoreButton={showAddMoreButton}
                  readOnly={readOnly}
                  onAdd={(user?: string) => onAdd(user ? [user] : undefined)}
                  hovering={hoveredUser?.user == rowData.name && hoveredUser?.accessGroup === accessGroup}
                  onRemove={() => {
                    onRemove && onRemove([rowData.name])
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

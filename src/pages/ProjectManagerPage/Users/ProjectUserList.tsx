
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { useMemo } from 'react'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { $Any } from '@types'
import { UserNode } from '@api/graphql'
import UserRow from './UserRow'

type Props = {
  selectedUsers: string[]
  userList: string[]
  tableList: $Any
  isLoading: boolean
  header?: string
  sortable?: boolean
  isUnassigned?: boolean
  onContextMenu?: $Any
  onSelectUsers?: (selectedUsers: string[]) => void
}

const ProjectUserList = ({
  selectedUsers,
  userList,
  tableList,
  isLoading,
  header,
  sortable = false,
  isUnassigned = false,
  onContextMenu,
  onSelectUsers,
}: Props) => {
  // Selection
  const selection = useMemo(() => {
    return userList.filter((user: string) => selectedUsers.includes(user))
  }, [selectedUsers, userList])

  const onSelectionChange = (e: $Any) => {
    const result = e.value.map((user: UserNode) => user.name)

    onSelectUsers!(result)
  }

  const tableData = useTableLoadingData(tableList, isLoading, 40, 'name')
  const selectedUnassignedUsers = tableData.filter((user: $Any) => selectedUsers.includes(user.name))
  const selectedUnassignedUserNames = selectedUnassignedUsers.map((user: $Any) => user.name)
  // Render
  return (
    <Section wrap>
      <TablePanel>
        <DataTable
          selection={selectedUnassignedUsers}
          value={tableData}
          selectionMode="multiple"
          scrollable={true}
          scrollHeight="flex"
          dataKey="name"
          className={clsx('user-list-table', { loading: isLoading })}
          rowClassName={(rowData: $Any) => clsx({ inactive: !rowData.active, loading: isLoading })}
          onContextMenu={onContextMenu}
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
                  showButtonsOnHover={selectedUnassignedUsers.length == 0}
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

export default ProjectUserList

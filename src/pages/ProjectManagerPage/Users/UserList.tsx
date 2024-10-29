
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import UserImage from '@components/UserImage'

import { useMemo } from 'react'
import styled from 'styled-components'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { accessGroupsSortFunction } from '@helpers/user'
import { $Any } from '@types'
import { UserModel } from '@api/rest/auth'

const StyledProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
`
export const ProfileRow = ({ rowData }: $Any) => {
  const { name, self, isMissing } = rowData
  return (
    <StyledProfileRow>
      {/* @ts-ignore */}
      <UserImage
        name={name}
        size={25}
        style={{
          transform: 'scale(0.8)',
          minHeight: 25,
          minWidth: 25,
          maxHeight: 25,
          maxWidth: 25,
        }}
        highlight={self}
      />
      <span
        style={{
          color: isMissing ? 'var(--color-hl-error)' : 'inherit',
        }}
      >
        {name}
      </span>
    </StyledProfileRow>
  )
}

type Props = {
  selectedProjects: string[],
  selectedUsers: string[],
  userList: UserModel[],
  tableList: $Any,
  isLoading: boolean,
  onSelectUsers: (selectedUsers: string[]) => void,
}

const ProjectUserList = ({
  selectedProjects,
  selectedUsers,
  userList,
  tableList,
  isLoading,
  onSelectUsers,
}: Props) => {
  // Selection
  const selection = useMemo(() => {
    return userList.filter((user: UserModel) => selectedUsers.includes(user.name))
  }, [selectedUsers, selectedProjects, userList])

  const onSelectionChange = (e: $Any) => {
    if (!onSelectUsers) return
    let result = []
    for (const user of e.value) result.push(user.name)
    onSelectUsers(result)
  }

  const tableData = useTableLoadingData(tableList, isLoading, 40, 'name')

  // Render
  return (
    <Section wrap>
      <TablePanel>
        <DataTable
          value={tableData}
          scrollable={true}
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className={clsx('user-list-table', { loading: isLoading })}
          rowClassName={(rowData: $Any) => clsx({ inactive: !rowData.active, loading: isLoading })}
          onSelectionChange={onSelectionChange}
          selection={selection}
          columnResizeMode="expand"
          resizableColumns
          // @ts-ignore
          responsive="true"
          stateKey="users-datatable"
          stateStorage={'local'}
          reorderableColumns
        >
          <Column
            field="name"
            header="Username"
            body={(rowData) => !isLoading && <ProfileRow rowData={rowData} />}
            sortable
            resizeable
          />
          <Column field="attrib.fullName" header="Full name" sortable resizeable />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default ProjectUserList

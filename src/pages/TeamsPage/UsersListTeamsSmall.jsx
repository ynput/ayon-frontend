import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import UserImage from '/src/components/UserImage'
import styled from 'styled-components'

const StyledProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  overflow: hidden;
`

const StyledUserImage = styled(UserImage)`
  margin: 'auto';
  transform: scale(0.8);
`

const StyledSection = styled(Section)`
  height: 85%;
  flex: 1.5;
`

const FullnameImage = ({ rowData }) => {
  const { name, self, isMissing } = rowData
  const { fullName } = rowData.attrib || false
  return (
    <StyledProfileRow>
      <StyledUserImage $isMissing={isMissing} name={name} size={25} highlight={self}/>
      <span style={{ color: isMissing ? 'var(--color-hl-error)' : 'inherit' }}>
        {fullName || name}
      </span>
    </StyledProfileRow>
  )
  }

const UsersListTeamsSmall = ({ handleContext, userList, isLoading, onSelectionChange, onContextSelectionChange, selection }) => {
  return (
    <StyledSection>
      <TablePanel onContextMenu={handleContext}>
        <DataTable
          value={userList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className={`user-list-table ${isLoading ? 'table-loading' : ''}`}
          onSelectionChange={onSelectionChange}
          onContextMenuSelectionChange={onContextSelectionChange}
          onContextMenu={handleContext}
          selection={selection}
          resizableColumns
          responsive="true"
          autoLayout="true"
          tableStyle={{
              width: '100%',
          }}
          groupRowsBy={'group'}
          rowGroupMode="subheader"
          rowGroupHeaderTemplate={(data) => {
              return <div>{data.group}</div>
        }}
        >
          <Column
            field="attrib.fullName"
            header="Full Name"
            style={{ width: '20%' }}
            body={(rowData) => FullnameImage({ rowData })}
          />
        </DataTable>
      </TablePanel>
    </StyledSection>
  )
}

export default UsersListTeamsSmall
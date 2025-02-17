import { Button, Spacer } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import useFileManagerMutations from './hooks/useFileManagerMutations'
import { toast } from 'react-toastify'
import { confirmDialog } from 'primereact/confirmdialog'
import FilesTable from './FilesTable/FilesTable'
import useFetchManagerData from './hooks/useFetchManagerData'
import { useState } from 'react'

const StyledHeader = styled.div`
  display: flex;
  flex-direction: row;
  padding-bottom: 4px;
`

type Props = {
  manager: string
  manageMode: boolean
  setManageMode: (value: boolean) => void
}

const AddonManager: React.FC<Props> = ({ manager, setManageMode }) => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [focused, setFocused] = useState<string | null>(null)
  const { deleteInstallers, deletePackages } = useFileManagerMutations()
  const data = useFetchManagerData(manager)

  const selectedIds = Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id)

  const handleDeleteInstallers = () => {
    confirmDialog({
      header: 'Delete selected files',
      message: (
        <>
          <p>Are you sure you want to delete the following files?</p>
          <ul>
            {selectedIds.map((filename) => (
              <li key={filename}>{filename}</li>
            ))}
          </ul>
        </>
      ),
      accept: async () => {
        if (manager === 'installer') {
          await deleteInstallers(selectedIds.map((filename) => filename))
        } else {
          await deletePackages(selectedIds.map((filename) => filename))
        }
        setRowSelection({})
        toast.success('Files deleted')
      },
      reject: () => {},
    })
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StyledHeader>
        <Button onClick={() => setManageMode(false)} label="Upload files" />
        <Spacer />
        <Button
          variant="danger"
          label="Delete selected"
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleDeleteInstallers}
        />
      </StyledHeader>

      <FilesTable
        data={data}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        focused={focused}
        setFocused={setFocused}
      />
    </div>
  )
}

export default AddonManager

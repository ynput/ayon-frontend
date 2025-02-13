import { useListInstallersQuery } from '@queries/installers/getInstallers'
import { Button, Spacer } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import useSelection from './hooks/useSelection'
import useMutation from './hooks/useMutation'
import { toast } from 'react-toastify'
import { confirmDialog } from 'primereact/confirmdialog'
import FilesTable from './FilesTable/FilesTable'

const StyledHeader = styled.div`
  display: flex;
  flex-direction: row;
  padding-bottom: 4px;

`

const StyledBody = styled.div`
  background-color: var(--panel-background);
  height: 100%;
  overflow-y: scroll;
`

type Props = {
  manageMode: boolean
  setManageMode: (value: boolean) => void
}

const AddonManager: React.FC<Props> = ({ setManageMode }) => {
  const { data  = {}} = useListInstallersQuery({})
  const { selection, updateSelection, pushClickEvent } = useSelection([])
  const { deleteInstallers } = useMutation()

  const handleDeleteInstallers = () => {
    confirmDialog({
      header: 'Delete selected files',
      message: <p>Are you sure you want to delete selected installers?</p>,
      accept: async () => {
        await deleteInstallers(selection.map((index) => data.installers![index].filename))
        updateSelection([])
        toast.success('Operation successful')
      },
      reject: () => {},
    })
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <StyledHeader>
        <Button onClick={() => setManageMode(false)} label="Upload files" />
        <Spacer />
        <Button
          variant="danger"
          label="Delete selected"
          disabled={selection.length == 0}
          onClick={handleDeleteInstallers}
        />
      </StyledHeader>

      <FilesTable data={data.installers} selection={selection} rowClickHandler={pushClickEvent} />
    </div>
  )
}

export default AddonManager

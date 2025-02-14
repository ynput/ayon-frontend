import { Button, Spacer } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import useSelection from './hooks/useSelection'
import useFileManagerMutations from './hooks/useFileManagerMutations'
import { toast } from 'react-toastify'
import { confirmDialog } from 'primereact/confirmdialog'
import FilesTable from './FilesTable/FilesTable'
import useFetchManagerData from './hooks/useFetchManagerData'

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
  manager: string
  manageMode: boolean
  setManageMode: (value: boolean) => void
}

const AddonManager: React.FC<Props> = ({ manager, setManageMode }) => {
  const { focused, selection, updateSelection, pushClickEvent } = useSelection([])
  const { deleteInstallers, deletePackages } = useFileManagerMutations()
  const {installers, packages} = useFetchManagerData()

  const handleDeleteInstallers = () => {
    confirmDialog({
      header: 'Delete selected files',
      message: <p>Are you sure you want to delete the selected files?</p>,
      accept: async () => {
        if ( manager === 'installer') {
          await deleteInstallers(selection.map((index) => installers.installers![index].filename))
        } else {
          await deletePackages(selection.map((index) => packages.packages![index].filename))
        }
        updateSelection([])
        toast.success('Operation successful')
      },
      reject: () => {},
    })
  }
          const data =
            manager === 'installer'
              ? installers.installers
              : packages.packages?.map((el) => ({ ...el, version: el.installerVersion })) ?? []

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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

      <FilesTable
        data={data}
        selection={selection}
        focused={focused}
        rowClickHandler={pushClickEvent}
      />
    </div>
  )
}

export default AddonManager

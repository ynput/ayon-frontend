import { Installer } from '@api/rest/installers'
import { useListInstallersQuery } from '@queries/installers/getInstallers'
import { Button, getFileSizeString, Spacer } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import useSelection from './hooks/useSelection'
import useMutation from './hooks/useMutation'
import { toast } from 'react-toastify'
import clsx from 'clsx'

const StyledHeader = styled.div`
  display: flex;
  flex-direction: row;
  padding-bottom: 4px;

`

const StyledBody = styled.div`
  background-color: var(--panel-background);
  height: 100%;
`
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  cursor: pointer;
  user-select: none;
`
const StyledHeadTr = styled.tr`
    background-color: var(--md-sys-color-surface-container-lowest-dark);
`

const StyledTr = styled.tr`
  &.selected {
    background-color: var(--md-sys-color-primary-container);
    outline: solid .15rem var(--focus-color)
  }
`

const StyledTd = styled.td`
  text-align: start;
`

type Props = {
  manageMode: boolean
  setManageMode: (value: boolean) => void
}

const AddonManager: React.FC<Props> = ({ setManageMode }) => {
  const { isFetching, data  = {}} = useListInstallersQuery({})
  const { selection, updateSelection } = useSelection([])
  const { deleteInstallers } = useMutation()

  const handleDeleteInstallers = () => {
    deleteInstallers(selection)
    updateSelection([])
    toast.success('Operation successful')
  }

  return (
    <>
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

      <StyledBody>
        <StyledTable>
          <StyledHeadTr>
            <StyledTd>File name</StyledTd>
            <StyledTd>Installer version</StyledTd>
            <StyledTd>Platform</StyledTd>
            <StyledTd>Size</StyledTd>
          </StyledHeadTr>

          {data?.installers?.map((installer: Installer) => (
            <StyledTr
              key={installer.filename}
              onClick={() => updateSelection([installer.filename])}
              className={clsx({ selected: selection.includes(installer.filename) })}
            >
              <StyledTd>{installer.filename}</StyledTd>
              <StyledTd>{installer.version}</StyledTd>
              <StyledTd style={{textTransform: 'capitalize'}}>{installer.platform}</StyledTd>
              <StyledTd>{getFileSizeString(installer.size ?? 0)}</StyledTd>
            </StyledTr>
          ))}
        </StyledTable>
      </StyledBody>
    </>
  )
}

export default AddonManager

import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { Dialog, FormRow } from '@ynput/ayon-react-components'
import { FC } from 'react'

interface ListInfoDialogProps {}

const ListInfoDialog: FC<ListInfoDialogProps> = ({}) => {
  const { infoDialogData, setInfoDialogData } = useListsContext()

  return (
    <Dialog
      isOpen={!!infoDialogData}
      onClose={() => setInfoDialogData(null)}
      header={`${infoDialogData?.label}`}
      size="md"
    >
      {/* loop through fields */}
      {infoDialogData &&
        Object.entries(infoDialogData).map(([key, value]) => (
          <FormRow key={key} label={key}>
            <span>{value}</span>
          </FormRow>
        ))}
    </Dialog>
  )
}

export default ListInfoDialog

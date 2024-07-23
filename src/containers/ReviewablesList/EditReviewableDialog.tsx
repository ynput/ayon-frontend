import { useUpdateReviewableMutation } from '@/services/review/updateReview'
import {
  Button,
  Dialog,
  DialogProps,
  InputText,
  SaveButton,
  Toolbar,
} from '@ynput/ayon-react-components'
import { FC, FormEvent, useState } from 'react'
import { toast } from 'react-toastify'
import { RenameTitle } from './ReviewablesList.styled'

interface EditReviewableDialogProps extends DialogProps {
  label: string
  onClose: () => void
  activityId: string
  projectName: string
  versionId: string
}

const EditReviewableDialog: FC<EditReviewableDialogProps> = ({
  onClose,
  label,
  projectName,
  versionId,
  activityId,
  ...props
}) => {
  const [labelForm, setLabelForm] = useState('')

  const [updateReviewable, { isLoading }] = useUpdateReviewableMutation()

  const handleUpdateReviewable = async () => {
    try {
      // update reviewable
      await updateReviewable({
        projectName,
        versionId,
        activityId,
        updateReviewablesRequest: {
          label: labelForm,
        },
      }).unwrap()

      toast.success('Reviewable updated successfully')

      // close dialog
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update reviewable')
    }
  }

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (labelForm) {
      handleUpdateReviewable()
    }
  }

  const handleCancel = () => {
    // clear form
    setLabelForm('')
    // close dialog
    onClose()
  }

  return (
    <Dialog
      onClose={onClose}
      header={<RenameTitle>{`Editing: ${label}`}</RenameTitle>}
      footer={
        <Toolbar>
          <Button label="Cancel" onClick={handleCancel} variant="text" />
          <SaveButton
            label="Save"
            active={!!labelForm}
            saving={isLoading}
            type="submit"
            form="reviewable-form"
          />
        </Toolbar>
      }
      size="sm"
      {...props}
    >
      <form onSubmit={handleFormSubmit} id="reviewable-form">
        <InputText
          value={labelForm}
          onChange={(e) => setLabelForm(e.target.value)}
          placeholder="Enter a new label"
          style={{ width: '100%' }}
          autoFocus
          onKeyDown={(e) =>
            e.key === 'Enter' && (e.ctrlKey || e.metaKey) && handleUpdateReviewable()
          }
        />
      </form>
    </Dialog>
  )
}

export default EditReviewableDialog

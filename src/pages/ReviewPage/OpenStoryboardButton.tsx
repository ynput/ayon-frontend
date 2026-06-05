import { useListsContext } from '@pages/ProjectListsPage/context'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { Link } from 'react-router-dom'

interface OpenStoryboardButtonProps extends ButtonProps {
  projectName: string
}

const OpenStoryboardButton: FC<OpenStoryboardButtonProps> = ({ projectName, ...props }) => {
  const { selectedList, createReviewSessionList } = useListsContext()

  if (!selectedList) return null

  if (selectedList.entityListType === 'storyboard') {
    return (
      <Link to={`/projects/${projectName}/storyboards/${selectedList?.id}`} target="_blank">
        <Button label="Open storyboard" variant="filled" icon="subscriptions" {...props} />
      </Link>
    )
  }

  if (createReviewSessionList) {
    const handleCreate = async () => {
      await createReviewSessionList(selectedList.id, {
        showToast: true,
        navigateOnSuccess: true,
      })
    }
    return (
      <Button
        label="Create storyboard"
        variant="filled"
        icon="subscriptions"
        onClick={handleCreate}
        {...props}
      />
    )
  }

  return null
}

export default OpenStoryboardButton

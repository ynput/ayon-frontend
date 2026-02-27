import { useListsContext } from '@pages/ProjectListsPage/context'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { Link } from 'react-router-dom'

interface OpenReviewSessionButtonProps extends ButtonProps {
  projectName: string
}

const OpenReviewSessionButton: FC<OpenReviewSessionButtonProps> = ({ projectName, ...props }) => {
  const { selectedList, createReviewSessionList } = useListsContext()

  if (!selectedList) return null

  if (selectedList.entityListType === 'review-session') {
    return (
      <Link to={`/projects/${projectName}/reviews/${selectedList?.id}`} target="_blank">
        <Button label="Open review" variant="filled" icon="subscriptions" {...props} />
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
        label="Create review"
        variant="filled"
        icon="subscriptions"
        onClick={handleCreate}
        {...props}
      />
    )
  }

  return null
}

export default OpenReviewSessionButton

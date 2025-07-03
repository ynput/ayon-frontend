import { useListsContext } from '@pages/ProjectListsPage/context'
import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { Link } from 'react-router-dom'

interface OpenReviewSessionButtonProps {
  projectName: string
}

const OpenReviewSessionButton: FC<OpenReviewSessionButtonProps> = ({ projectName }) => {
  const { selectedList, createReviewSessionList } = useListsContext()

  if (!selectedList) return null

  if (selectedList.entityListType === 'review-session') {
    return (
      <Link to={`/projects/${projectName}/reviews/${selectedList?.id}`} target="_blank">
        <Button label="Open review" variant="filled" icon="subscriptions" />
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
      <Button label="Create review" variant="filled" icon="subscriptions" onClick={handleCreate} />
    )
  }

  return null
}

export default OpenReviewSessionButton

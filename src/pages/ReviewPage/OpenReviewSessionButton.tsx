import { useListsContext } from '@pages/ProjectListsPage/context'
import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { Link } from 'react-router-dom'

interface OpenReviewSessionButtonProps {
  projectName: string
}

const OpenReviewSessionButton: FC<OpenReviewSessionButtonProps> = ({ projectName }) => {
  const { selectedList } = useListsContext()

  if (!selectedList || selectedList.entityListType !== 'review-session') return null

  return (
    <Link to={`/projects/${projectName}/reviews/${selectedList?.id}`} target="_blank">
      <Button label="Open review" variant="filled" icon="subscriptions" />
    </Link>
  )
}

export default OpenReviewSessionButton

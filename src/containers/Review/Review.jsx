import { useMemo } from 'react'
import { Button } from '@ynput/ayon-react-components'
import * as Styled from './Review.styled'
import VersionSelectorTool from '@components/VersionSelectorTool/VersionSelectorTool'
import { useGetReviewablesForProductQuery } from '@queries/review/getReview'
import { useDispatch, useSelector } from 'react-redux'
import { updateSelection } from '@state/review'
import ReviewDetailsPanel from './ReviewDetailsPanel'
import ReviewPlayer from './ReviewPlayer'

const Review = ({ onClose }) => {
  const {
    productId,
    projectName,
    versionIds = [],
    reviewableIds = [],
  } = useSelector((state) => state.review)

  const dispatch = useDispatch()

  // new query: returns all reviewables for a product
  const { data: versionsAndReviewables = [], isFetching: isFetchingReviewables } =
    useGetReviewablesForProductQuery({ projectName, productId: productId }, { skip: !productId })

  // This should not return the first reviewable, but there should be reviewable
  // selector in the UI
  const selectedVersion = useMemo(
    () => versionsAndReviewables.find((v) => v.id === versionIds[0]),
    [versionIds, versionsAndReviewables],
  )

  const selectedReviewable = useMemo(
    // for now we only support one reviewable
    () => selectedVersion?.reviewables.find((r) => r.id === reviewableIds[0]),
    [reviewableIds, selectedVersion],
  )

  const handleVersionChange = (id) => {
    dispatch(updateSelection({ versionIds: [id] }))
  }

  const isLoadingAll = isFetchingReviewables

  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool
          versions={versionsAndReviewables}
          selected={versionIds[0]}
          isLoading={isLoadingAll}
          onChange={handleVersionChange}
        />
        {onClose && <Button onClick={onClose} icon={'close'} />}
      </Styled.Header>
      <Styled.Content>
        <ReviewPlayer projectName={projectName} reviewable={selectedReviewable} />
        <ReviewDetailsPanel versionIds={versionIds} projectName={projectName} />
      </Styled.Content>
    </Styled.Container>
  )
}

export default Review

import { useMemo } from 'react'
import { Button } from '@ynput/ayon-react-components'
import * as Styled from './Review.styled'
import VersionSelectorTool from '@components/VersionSelectorTool/VersionSelectorTool'
import { useGetReviewablesForProductQuery } from '@queries/review/getReview'
import { useDispatch } from 'react-redux'
import { updateSelection } from '@state/review'
import ReviewDetailsPanel from './ReviewDetailsPanel'
import ReviewPlayer from './ReviewPlayer'

const Review = ({ projectName, productId, versionIds = [], onClose }) => {
  const dispatch = useDispatch()

  // new query: returns all reviewables for a product
  const { data: allReviewables, isFetching: isFetchingReviewables } =
    useGetReviewablesForProductQuery({ projectName, productId: productId }, { skip: !productId })

  const versions = useMemo(() => {
    // Get a list of all versions that have reviewables
    if (!allReviewables?.length) return []
    const result = []
    const ids = []
    for (const reviewable of allReviewables || []) {
      if (ids.includes(reviewable.versionId)) continue
      ids.push(reviewable.versionId)
      result.push({
        id: reviewable.versionId,
        name: reviewable.versionName,
        status: reviewable.status,
      })
    }
    return result
  }, [allReviewables])

  // This should not return the first reviewable, but there should be reviewable
  // selector in the UI
  const selectedReviewable = useMemo(() => {
    if (!versionIds.length) return null
    if (!allReviewables?.length) return null
    const res = allReviewables.find(({ versionId }) => versionId === versionIds[0])
    return res
  }, [versionIds, allReviewables])

  const handleVersionChange = (id) => {
    dispatch(updateSelection({ versionIds: [id] }))
  }

  const isLoadingAll = isFetchingReviewables

  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool
          versions={versions}
          selected={versionIds[0]}
          isLoading={isLoadingAll}
          onChange={handleVersionChange}
        />
        <Button onClick={onClose} icon={'close'} />
      </Styled.Header>
      <Styled.Content>
        <ReviewPlayer projectName={projectName} reviewable={selectedReviewable} />
        <ReviewDetailsPanel versionIds={versionIds} projectName={projectName} />
      </Styled.Content>
    </Styled.Container>
  )
}

export default Review
